package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmailOrUsername(String email, String username);

    // Atomic spend: the WHERE currentPoints >= :cost makes this a single
    // conditional UPDATE the DB serializes per row, so two concurrent
    // redemptions racing for the same balance can't both succeed (unlike a
    // read-then-write check). Returns rows updated (0 = insufficient balance
    // or no such user).
    @Modifying
    @Query("UPDATE User u SET u.currentPoints = u.currentPoints - :cost WHERE u.id = :id AND u.currentPoints >= :cost")
    int deductPointsIfSufficient(@Param("id") UUID id, @Param("cost") int cost);
}
