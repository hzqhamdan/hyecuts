package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "tiers")
public class Tier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name; // e.g., Rookie, Regular, Legend, Master, Icon

    @Column(name = "points_required", nullable = false)
    private Integer pointsRequired;

    @Column(name = "discount_multiplier", nullable = false, precision = 3, scale = 2)
    private BigDecimal discountMultiplier; // e.g., 0.15 for 15% off

    @Column(name = "benefits_description", columnDefinition = "TEXT")
    private String benefitsDescription;

    public Tier() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getPointsRequired() { return pointsRequired; }
    public void setPointsRequired(Integer pointsRequired) { this.pointsRequired = pointsRequired; }
    public BigDecimal getDiscountMultiplier() { return discountMultiplier; }
    public void setDiscountMultiplier(BigDecimal discountMultiplier) { this.discountMultiplier = discountMultiplier; }
    public String getBenefitsDescription() { return benefitsDescription; }
    public void setBenefitsDescription(String benefitsDescription) { this.benefitsDescription = benefitsDescription; }
}
