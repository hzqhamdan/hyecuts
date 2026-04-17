package com.hyecuts.loyalty.repository;
import com.hyecuts.loyalty.model.UserMissionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UserMissionProgressRepository extends JpaRepository<UserMissionProgress, Long> {
    List<UserMissionProgress> findByUserId(String userId);
}
