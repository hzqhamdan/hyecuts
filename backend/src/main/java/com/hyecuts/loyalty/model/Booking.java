package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Only the fields the booking UIs actually display (member name/email in
    // admin lists, "your appointment" summaries) are serialized here — not the
    // full User, which would otherwise drag a per-user avatar (up to ~1MB
    // base64) and other PII into every row of /api/bookings/all.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = {
        "hibernateLazyInitializer", "handler",
        "avatar", "phone", "dob", "hairType", "hairLength", "hairScalp",
        "referralCode", "oauthProvider", "currentPoints", "lifetimePoints",
        "tier", "role", "createdAt", "username",
        "lastBeardTrimRedeemed", "birthMonth", "birthdayBonusYear", "lastQuarterlyVoucherQuarter"
    })
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private BarberService service;

    @Column(name = "appointment_time", nullable = false)
    private LocalDateTime appointmentTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "total_price_myr", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPriceMyr; // Paid in MYR

    @Column(name = "points_awarded")
    private Integer pointsAwarded;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum BookingStatus {
        PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
    }

    public Booking() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BarberService getService() { return service; }
    public void setService(BarberService service) { this.service = service; }
    public LocalDateTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalDateTime appointmentTime) { this.appointmentTime = appointmentTime; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
    public BigDecimal getTotalPriceMyr() { return totalPriceMyr; }
    public void setTotalPriceMyr(BigDecimal totalPriceMyr) { this.totalPriceMyr = totalPriceMyr; }
    public Integer getPointsAwarded() { return pointsAwarded; }
    public void setPointsAwarded(Integer pointsAwarded) { this.pointsAwarded = pointsAwarded; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
