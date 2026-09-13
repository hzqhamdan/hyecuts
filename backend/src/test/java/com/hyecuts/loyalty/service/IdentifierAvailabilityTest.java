package com.hyecuts.loyalty.service;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Runs against a real schema rather than a mocked repository. The rule's whole
 * value is which rows it considers, and a mock would only echo back whatever it
 * was told to return.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class IdentifierAvailabilityTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private IdentifierAvailability availability;
    private User alice;

    @BeforeEach
    void setUp() {
        availability = new IdentifierAvailability(userRepository);

        alice = new User();
        alice.setEmail("alice@x.com");
        alice.setUsername("alice");
        alice.setPasswordHash("not-a-real-hash");
        entityManager.persist(alice);
        entityManager.flush();
    }

    @Test
    void isTaken_whenValueMatchesAnEmailInAnyCase() {
        assertTrue(availability.isTaken("ALICE@X.COM"));
    }

    @Test
    void isTaken_whenValueMatchesAUsernameInAnyCase() {
        // "Alice" matches the username but not the email — so this proves the
        // username column is checked, not just the email column.
        assertTrue(availability.isTaken("Alice"));
    }

    @Test
    void isTaken_falseWhenNeitherColumnMatches() {
        assertFalse(availability.isTaken("bob@x.com"));
    }

    @Test
    void isTakenByAnotherUser_ignoresTheUsersOwnEmailAndUsername() {
        // Alice must be able to set her username to her own email, in any casing.
        assertFalse(availability.isTakenByAnotherUser("ALICE@X.COM", alice.getId()));
        assertFalse(availability.isTakenByAnotherUser("ALICE", alice.getId()));
    }

    @Test
    void isTakenByAnotherUser_detectsASquatOnAnotherUsersEmail() {
        // AUTH-027: Mallory attempting to take Alice's email as her username. The old
        // check compared only against usernames and allowed this.
        UUID malloryId = UUID.randomUUID();

        assertTrue(availability.isTakenByAnotherUser("alice@x.com", malloryId));
    }

    @Test
    void isTakenByAnotherUser_detectsACollisionWithAnotherUsersUsername() {
        // The reverse direction: Mallory setting her email (or username) to a value that
        // is Alice's username. "alice" is not Alice's email, so only the username clause
        // can catch this.
        UUID malloryId = UUID.randomUUID();

        assertTrue(availability.isTakenByAnotherUser("ALICE", malloryId));
    }
}
