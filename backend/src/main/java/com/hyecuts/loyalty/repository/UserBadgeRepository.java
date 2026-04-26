package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUser_Id(UUID userId);
}
