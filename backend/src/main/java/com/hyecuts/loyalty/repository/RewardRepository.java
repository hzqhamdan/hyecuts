package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface RewardRepository extends JpaRepository<Reward, UUID> {}
