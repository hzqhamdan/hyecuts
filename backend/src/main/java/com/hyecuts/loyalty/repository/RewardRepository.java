package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {
    java.util.Optional<Reward> findByTitle(String title);

    // Atomic claim-one-unit-of-stock: the WHERE stockCount > 0 makes this a
    // single conditional UPDATE the DB serializes per row, so two concurrent
    // redemptions of the last unit can't both succeed (unlike read-then-write).
    // Returns the number of rows updated (0 = no stock left).
    @Modifying
    @Query("UPDATE Reward r SET r.stockCount = r.stockCount - 1 WHERE r.id = :id AND r.stockCount > 0")
    int decrementStockIfAvailable(@Param("id") UUID id);
}
