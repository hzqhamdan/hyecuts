package com.hyecuts.loyalty.security;

import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The spec's scenarios end-to-end, against real rows and real SQL.
 *
 * <p>The unit test pins the algorithm with mocks; this proves the algorithm and the
 * queries together produce the right account for the situations that actually
 * caused the bugs.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class AccountResolutionIntegrationTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private CustomUserDetailsService service;

    @BeforeEach
    void setUp() {
        service = new CustomUserDetailsService(userRepository);
    }

    private User persist(String email, String username) {
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash("not-a-real-hash");
        entityManager.persist(user);
        entityManager.flush();
        return user;
    }

    private UUID resolve(String identifier) {
        return ((CustomUserDetails) service.loadUserByUsername(identifier)).getId();
    }

    @Test
    void caseInsensitiveSignIn_resolvesTheRegisteredAccount() {
        // AUTH-022: registered as User@X.com, signs in as user@x.com.
        User user = persist("User@X.com", "User@X.com");

        assertEquals(user.getId(), resolve("user@x.com"));
    }

    @Test
    void squattedUsername_cannotCaptureTheOwnersSignIn() {
        // AUTH-027: Alice renamed her username, then Mallory took Alice's email as hers.
        User alice = persist("alice@x.com", "alice");
        persist("mallory@x.com", "alice@x.com");

        assertEquals(alice.getId(), resolve("alice@x.com"));
    }

    @Test
    void squatDifferingOnlyInCase_stillResolvesTheOwner() {
        User alice = persist("alice@x.com", "alice");
        persist("mallory@x.com", "ALICE@X.COM");

        assertEquals(alice.getId(), resolve("ALICE@X.COM"));
    }

    @Test
    void squattedUsername_cannotBreakResolutionById() {
        User alice = persist("alice@x.com", "alice");
        persist("mallory@x.com", "alice@x.com");

        assertEquals(alice.getId(), service.loadUserById(alice.getId()).getId());
    }

    @Test
    void caseVariantPair_eachResolvesByExactCasing() {
        User upper = persist("Jane@x.com", "Jane@x.com");
        User lower = persist("jane@x.com", "jane@x.com");

        assertEquals(upper.getId(), resolve("Jane@x.com"));
        assertEquals(lower.getId(), resolve("jane@x.com"));
    }

    @Test
    void caseVariantPair_otherCasingFailsClosedAndNeverResolvesToEitherAccount() {
        // The security-critical case: never resolve to the wrong person's account.
        persist("Jane@x.com", "Jane@x.com");
        persist("jane@x.com", "jane@x.com");

        assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("JANE@X.COM"));
    }
}
