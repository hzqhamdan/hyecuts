package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.LoyaltyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LoyaltyProfileRepository extends JpaRepository<LoyaltyProfile, Long> {
    Optional<LoyaltyProfile> findByUserId(String userId);
}
