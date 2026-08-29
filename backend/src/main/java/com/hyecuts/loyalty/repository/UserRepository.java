package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Tier;
import com.hyecuts.loyalty.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailOrUsername(String email, String username);
    List<User> findByTier(Tier tier);

    // Atomic spend: the WHERE currentPoints >= :cost makes this a single
    // conditional UPDATE the DB serializes per row, so two concurrent
    // redemptions racing for the same balance can't both succeed (unlike a
    // read-then-write check). Returns rows updated (0 = insufficient balance
    // or no such user).
    @Modifying
    @Query("UPDATE User u SET u.currentPoints = u.currentPoints - :cost WHERE u.id = :id AND u.currentPoints >= :cost")
    int deductPointsIfSufficient(@Param("id") UUID id, @Param("cost") int cost);

    // Same pattern (SCH-004): the WHERE clause makes "has this quarter's
    // voucher already been marked issued" and "mark it issued" one atomic
    // conditional UPDATE, so if the scheduler ever runs on more than one
    // replica at once, only the first to commit wins the row and issues a
    // voucher — the second sees 0 rows updated and skips.
    @Modifying
    @Query("UPDATE User u SET u.lastQuarterlyVoucherQuarter = :quarterKey WHERE u.id = :id AND (u.lastQuarterlyVoucherQuarter IS NULL OR u.lastQuarterlyVoucherQuarter <> :quarterKey)")
    int markQuarterlyVoucherIssued(@Param("id") UUID id, @Param("quarterKey") String quarterKey);
}
