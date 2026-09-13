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
    List<User> findByTier(Tier tier);

    // Admin analytics (ADM-010): counted in the database, not by streaming findAll().
    @Query("SELECT new com.hyecuts.loyalty.repository.TierCount(u.tier, COUNT(u)) FROM User u GROUP BY u.tier")
    List<TierCount> countByTier();

    // Account resolution (AUTH-022/027). Every lookup returns a List — the exact
    // ones included — so callers can detect two or more matches and fail closed.
    // Exact email is unique by V1's constraint, but exact username is only unique
    // if V11's index exists in a given database; treating all four the same means
    // resolution never depends on which constraints happen to be present.
    List<User> findAllByEmail(String email);
    List<User> findAllByEmailIgnoreCase(String email);
    List<User> findAllByUsername(String username);
    List<User> findAllByUsernameIgnoreCase(String username);

    // Identifier availability (see IdentifierAvailability): a value is taken if it
    // matches any email or any username, ignoring case. The IdNot forms exclude the
    // caller's own row, so a user can set their username back to their own email.
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsernameIgnoreCase(String username);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, UUID id);

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
