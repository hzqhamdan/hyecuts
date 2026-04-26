package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "rewards")
@Getter
@Setter


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
}
