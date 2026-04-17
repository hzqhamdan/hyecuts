package com.hyecuts.loyalty.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Reward {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String description;
    
    // Type of reward: SERVICE_DISCOUNT, FREE_ADDON, MERCHANDISE, EXPERIENCE
    private String type;
    
    private Integer pointsCost;
    
    // Tier minimum required (e.g. "Legend")
    private String minimumTierRequired;
    
    // Unlimited if null, specific quantity if defined
    private Integer stockAvailable;
    
    public Reward() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getPointsCost() { return pointsCost; }
    public void setPointsCost(Integer pointsCost) { this.pointsCost = pointsCost; }
    public String getMinimumTierRequired() { return minimumTierRequired; }
    public void setMinimumTierRequired(String minimumTierRequired) { this.minimumTierRequired = minimumTierRequired; }
    public Integer getStockAvailable() { return stockAvailable; }
    public void setStockAvailable(Integer stockAvailable) { this.stockAvailable = stockAvailable; }
}
