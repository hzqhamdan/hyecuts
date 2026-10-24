package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

    @Test
    void countByTier_countsUsersPerTierInTheDatabase() {
        // ADM-010: replaces streaming findAll() over every user.
        persist("a@x.com", "a");
        persist("b@x.com", "b");
        User patron = persist("c@x.com", "c");
        patron.setTier(Tier.PATRON);
        entityManager.flush();

        Map<Tier, Long> counts = userRepository.countByTier().stream()
                .collect(Collectors.toMap(TierCount::tier, TierCount::users));

        assertEquals(Map.of(Tier.MEMBER, 2L, Tier.PATRON, 1L), counts);
    }

    private User withBalance(int points) {
        User user = persist("spender@x.com", "spender");
        user.setCurrentPoints(points);
        entityManager.flush();
        return user;
    }

    // deductPointsIfSufficient is a bulk UPDATE that bypasses the persistence
    // context, so the balance is read back after clearing it.
    private int balanceOf(User user) {
        entityManager.clear();
        return entityManager.find(User.class, user.getId()).getCurrentPoints();
    }

    @Test
    void deductPointsIfSufficient_spendsABalanceThatExactlyCoversTheCost() {
        User user = withBalance(500);

        assertEquals(1, userRepository.deductPointsIfSufficient(user.getId(), 500));
        assertEquals(0, balanceOf(user));
    }

    @Test
    void deductPointsIfSufficient_refusesWhenOnePointShort() {
        User user = withBalance(499);

        assertEquals(0, userRepository.deductPointsIfSufficient(user.getId(), 500));
        assertEquals(499, balanceOf(user));
    }

    @Test
    void deductPointsIfSufficient_secondRedeemAgainstTheSameBalanceFails() {
        // Two redeems that each fit the starting balance but not together:
        // the WHERE clause re-checks the balance, so only the first lands.
        User user = withBalance(500);

        assertEquals(1, userRepository.deductPointsIfSufficient(user.getId(), 300));
        assertEquals(0, userRepository.deductPointsIfSufficient(user.getId(), 300));
        assertEquals(200, balanceOf(user));
    }

    @Test
    void deductPointsIfSufficient_zeroCostLeavesTheBalanceAlone() {
        User user = withBalance(0);

        assertEquals(1, userRepository.deductPointsIfSufficient(user.getId(), 0));
        assertEquals(0, balanceOf(user));
    }

    @Test
    void deductPointsIfSufficient_unknownUserUpdatesNothing() {
        assertEquals(0, userRepository.deductPointsIfSufficient(java.util.UUID.randomUUID(), 1));
    }

    @Test
    void earnSavedFromAReadTakenBeforeARedeem_failsInsteadOfErasingTheRedeem() {
        // LOY-021: an earn (read-modify-write) reads 500, a redeem deducts 200
        // atomically, then the earn saves 500 + 100. Before User had @Version
        // that save wrote 600 and the redeem vanished; the bulk UPDATE now
        // bumps the version, so the stale save is rejected.
        User user = withBalance(500);
        User staleCopy = userRepository.findById(user.getId()).orElseThrow();
        long versionBefore = staleCopy.getVersion();

        assertEquals(1, userRepository.deductPointsIfSufficient(user.getId(), 200));
        staleCopy.setCurrentPoints(staleCopy.getCurrentPoints() + 100);

        assertThrows(org.springframework.orm.ObjectOptimisticLockingFailureException.class,
                () -> userRepository.saveAndFlush(staleCopy));
        assertEquals(300, balanceOf(user));
        assertEquals(versionBefore + 1, entityManager.find(User.class, user.getId()).getVersion());
    }

    @Test
    void markQuarterlyVoucherIssued_alsoBumpsTheVersion() {
        User user = withBalance(0);
        long versionBefore = user.getVersion();

        assertEquals(1, userRepository.markQuarterlyVoucherIssued(user.getId(), "2026-Q4"));

        entityManager.clear();
        assertEquals(versionBefore + 1, entityManager.find(User.class, user.getId()).getVersion());
    }
}
