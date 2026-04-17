package com.hyecuts.loyalty.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class ActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    
    // Type of action (e.g. "SERVICE_COMPLETED", "REVIEW_LEFT", "SOCIAL_SHARE")
    private String actionType;
    
    private String description;
    
    private Integer pointsEarned;
    
    private LocalDateTime timestamp;

    public ActivityLog() {}

    public ActivityLog(String userId, String actionType, String description, Integer pointsEarned) {
        this.userId = userId;
        this.actionType = actionType;
        this.description = description;
        this.pointsEarned = pointsEarned;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getActionType() { return actionType; }
    public void setActionType(String actionType) { this.actionType = actionType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getPointsEarned() { return pointsEarned; }
    public void setPointsEarned(Integer pointsEarned) { this.pointsEarned = pointsEarned; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
