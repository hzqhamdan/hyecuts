package com.hyecuts.loyalty.repository;

import com.hyecuts.loyalty.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {
    List<ActivityLog> findByUser_IdOrderByTimestampDesc(UUID userId);
}
