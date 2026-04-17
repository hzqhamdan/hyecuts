package com.hyecuts.loyalty.repository;
import com.hyecuts.loyalty.model.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserIdOrderByTimestampDesc(String userId);
}
