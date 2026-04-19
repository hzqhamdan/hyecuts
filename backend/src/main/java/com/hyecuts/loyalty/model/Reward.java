package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "rewards")
public class Reward {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "points_cost", nullable = false)
    private Integer pointsCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "min_tier_id")
    private Tier minTier; // Nullable if available to everyone

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "stock_count")
    private Integer stockCount; // Nullable if unlimited supply

    public Reward() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getPointsCost() { return pointsCost; }
    public void setPointsCost(Integer pointsCost) { this.pointsCost = pointsCost; }
    public Tier getMinTier() { return minTier; }
    public void setMinTier(Tier minTier) { this.minTier = minTier; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Integer getStockCount() { return stockCount; }
    public void setStockCount(Integer stockCount) { this.stockCount = stockCount; }
}
