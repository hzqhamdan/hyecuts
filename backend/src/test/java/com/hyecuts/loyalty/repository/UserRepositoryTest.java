package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Executes the derived account-resolution queries against a real schema.
 *
 * <p>Every one of these runs on the authentication path. A derived query that no
 * test executes first runs in production — that is how DB-018 happened — so each
 * is exercised here rather than trusted from its method name.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User persist(String email, String username) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("not-a-real-hash");
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

    @Test
    void findAllByEmailIgnoreCase_matchesRegardlessOfCasing() {
        User user = persist("User@X.com", "u1");

        List<User> matches = userRepository.findAllByEmailIgnoreCase("user@x.com");

        assertEquals(1, matches.size());
        assertEquals(user.getId(), matches.get(0).getId());
    }

    @Test
    void findAllByEmailIgnoreCase_returnsBothHalvesOfACaseVariantPair() {
        // Email uniqueness is case-sensitive, so both rows can legitimately exist.
        persist("Jane@x.com", "jane-upper");
        persist("jane@x.com", "jane-lower");

        assertEquals(2, userRepository.findAllByEmailIgnoreCase("JANE@X.COM").size());
    }

    @Test
    void findAllByEmail_isExactAndSeparatesACaseVariantPair() {
        persist("Jane@x.com", "jane-upper");
        User lower = persist("jane@x.com", "jane-lower");

        List<User> matches = userRepository.findAllByEmail("jane@x.com");

        assertEquals(1, matches.size());
        assertEquals(lower.getId(), matches.get(0).getId());
    }

    @Test
    void findAllByUsernameIgnoreCase_matchesRegardlessOfCasing() {
        User user = persist("a@x.com", "Alice");

        List<User> matches = userRepository.findAllByUsernameIgnoreCase("ALICE");

        assertEquals(1, matches.size());
        assertEquals(user.getId(), matches.get(0).getId());
    }

    @Test
    void findAllByUsername_isExact() {
        persist("a@x.com", "Alice");

        assertTrue(userRepository.findAllByUsername("alice").isEmpty());
    }

    @Test
    void existsIgnoreCase_detectsEmailAndUsernameInAnyCasing() {
        persist("alice@x.com", "alice");

        assertTrue(userRepository.existsByEmailIgnoreCase("ALICE@X.COM"));
        assertTrue(userRepository.existsByUsernameIgnoreCase("ALICE"));
        assertFalse(userRepository.existsByEmailIgnoreCase("bob@x.com"));
    }

    @Test
    void existsIgnoreCaseAndIdNot_excludesTheCallersOwnRow() {
        User alice = persist("alice@x.com", "alice");
        User bob = persist("bob@x.com", "bob");

        assertFalse(userRepository.existsByEmailIgnoreCaseAndIdNot("ALICE@X.COM", alice.getId()));
        assertTrue(userRepository.existsByEmailIgnoreCaseAndIdNot("ALICE@X.COM", bob.getId()));
        assertFalse(userRepository.existsByUsernameIgnoreCaseAndIdNot("ALICE", alice.getId()));
        assertTrue(userRepository.existsByUsernameIgnoreCaseAndIdNot("ALICE", bob.getId()));
    }
}
