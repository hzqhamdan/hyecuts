package com.hyecuts.loyalty.repository;
import com.hyecuts.loyalty.model.RewardRedemption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RewardRedemptionRepository extends JpaRepository<RewardRedemption, Long> {
    List<RewardRedemption> findByUserId(String userId);
}
