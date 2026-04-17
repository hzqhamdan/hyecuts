package com.hyecuts.loyalty.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class UserMissionProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String userId;
    private Long missionId; // Reference to Mission entity
    
    private Integer currentProgress = 0;
    private Boolean isCompleted = false;
    
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public UserMissionProgress() {
        this.startedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Long getMissionId() { return missionId; }
    public void setMissionId(Long missionId) { this.missionId = missionId; }

    public Integer getCurrentProgress() { return currentProgress; }
    public void setCurrentProgress(Integer currentProgress) { this.currentProgress = currentProgress; }

    public Boolean getCompleted() { return isCompleted; }
    public void setCompleted(Boolean completed) { isCompleted = completed; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
