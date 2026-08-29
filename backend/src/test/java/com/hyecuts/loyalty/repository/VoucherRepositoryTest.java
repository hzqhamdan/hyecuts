package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Reward;
import com.hyecuts.loyalty.model.User;
import com.hyecuts.loyalty.model.Voucher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The first test in this module that boots a Spring context (DB-018).
 *
 * <p>Every other backend test is a pure Mockito unit test, which means the
 * bulk-update {@code @Query} strings in this repository were never executed
 * by the build at all — a malformed one would have failed the deploy, not the
 * test run. Loading a real EntityManager here both validates that JPQL and
 * gives us a persistence context, which is the only place the RW-024
 * staleness bug is observable: mocks have no first-level cache to go stale.
 *
 * <p>Flyway is disabled because the migrations are PostgreSQL-specific;
 * {@code @DataJpaTest} builds the schema from the entities against H2.
 */
@DataJpaTest(properties = "spring.flyway.enabled=false")
class VoucherRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private VoucherRepository voucherRepository;

    private User user;
    private Reward reward;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("voucher-repo-test@hyecuts.com");
        user.setPasswordHash("not-a-real-hash");
        entityManager.persist(user);

        reward = new Reward();
        reward.setTitle("Test Reward");
        reward.setPointsCost(100);
        entityManager.persist(reward);
    }

    private void persistVoucher(String id, Voucher.VoucherStatus status, LocalDateTime expiresAt) {
        Voucher v = new Voucher();
        v.setId(id);
        v.setUser(user);
        v.setReward(reward);
        v.setStatus(status);
        v.setExpiresAt(expiresAt);
        entityManager.persist(v);
        entityManager.flush();
    }

    @Test
    void fulfillIfActive_readBackReflectsTheWrite() {
        // RW-024, the regression this whole file exists for. persistVoucher
        // leaves an ACTIVE copy in the first-level cache; the bulk UPDATE
        // writes straight past it. Without clearAutomatically = true the
        // findById below returns that cached ACTIVE copy and this fails.
        persistVoucher("V-FRESH", Voucher.VoucherStatus.ACTIVE, null);

        assertEquals(1, voucherRepository.fulfillIfActive("V-FRESH", LocalDateTime.now()));

        Voucher readBack = voucherRepository.findById("V-FRESH").orElseThrow();
        assertEquals(Voucher.VoucherStatus.REDEEMED, readBack.getStatus());
        assertNotNull(readBack.getRedeemedAt());
    }

    @Test
    void fulfillIfActive_shouldNotReFulfilARedeemedVoucher() {
        persistVoucher("V-DOUBLE", Voucher.VoucherStatus.ACTIVE, null);

        assertEquals(1, voucherRepository.fulfillIfActive("V-DOUBLE", LocalDateTime.now()));
        assertEquals(0, voucherRepository.fulfillIfActive("V-DOUBLE", LocalDateTime.now()));
    }

    @Test
    void fulfillIfActive_shouldNotFulfilAnExpiredVoucher() {
        persistVoucher("V-EXPIRED", Voucher.VoucherStatus.ACTIVE, LocalDateTime.now().minusDays(1));

        assertEquals(0, voucherRepository.fulfillIfActive("V-EXPIRED", LocalDateTime.now()));
    }

    @Test
    void fulfillIfActive_shouldFulfilAVoucherExpiringInTheFuture() {
        persistVoucher("V-FUTURE", Voucher.VoucherStatus.ACTIVE, LocalDateTime.now().plusDays(7));

        assertEquals(1, voucherRepository.fulfillIfActive("V-FUTURE", LocalDateTime.now()));
    }

    @Test
    void expireStaleVouchers_shouldOnlyExpirePastDatedActiveVouchers() {
        // Also the first execution of this query anywhere outside production.
        persistVoucher("V-STALE", Voucher.VoucherStatus.ACTIVE, LocalDateTime.now().minusDays(1));
        persistVoucher("V-LIVE", Voucher.VoucherStatus.ACTIVE, LocalDateTime.now().plusDays(1));
        persistVoucher("V-NOEXPIRY", Voucher.VoucherStatus.ACTIVE, null);

        assertEquals(1, voucherRepository.expireStaleVouchers(LocalDateTime.now()));
    }
}
