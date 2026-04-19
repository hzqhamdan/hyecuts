package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "barber_services")
public class BarberService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_myr", nullable = false, precision = 10, scale = 2)
    private BigDecimal priceMyr; // Pricing in MYR

    @Column(name = "base_points", nullable = false)
    private Integer basePoints;

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public BarberService() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPriceMyr() { return priceMyr; }
    public void setPriceMyr(BigDecimal priceMyr) { this.priceMyr = priceMyr; }
    public Integer getBasePoints() { return basePoints; }
    public void setBasePoints(Integer basePoints) { this.basePoints = basePoints; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
