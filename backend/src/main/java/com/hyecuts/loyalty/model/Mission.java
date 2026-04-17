package com.hyecuts.loyalty.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Mission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    
    // DAILY, WEEKLY, QUEST
    private String type;
    
    // Points awarded upon completion
    private Integer rewardPoints;
    
    // The metric being tracked (e.g. BOOKING, REVIEW, SPEND)
    private String targetAction;
    
    // The amount of the metric needed (e.g. 3 haircuts = 3)
    private Integer requiredCount;

    public Mission() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getRewardPoints() { return rewardPoints; }
    public void setRewardPoints(Integer rewardPoints) { this.rewardPoints = rewardPoints; }
    public String getTargetAction() { return targetAction; }
    public void setTargetAction(String targetAction) { this.targetAction = targetAction; }
    public Integer getRequiredCount() { return requiredCount; }
    public void setRequiredCount(Integer requiredCount) { this.requiredCount = requiredCount; }
}
