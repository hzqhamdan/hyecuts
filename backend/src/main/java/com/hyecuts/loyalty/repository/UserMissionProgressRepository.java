package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.UserMissionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserMissionProgressRepository extends JpaRepository<UserMissionProgress, Long> {
    List<UserMissionProgress> findByUser_Id(UUID userId);
}
