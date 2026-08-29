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
    // Null for a guest booking (see guestName/guestEmail/guestPhone below) —
    // there's no account to earn points, get penalized, or log in as.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties(value = {
        "hibernateLazyInitializer", "handler",
        "avatar", "phone", "dob", "hairType", "hairLength", "hairScalp",
        "referralCode", "oauthProvider", "currentPoints", "lifetimePoints",
        "tier", "role", "createdAt", "username",
        "lastBeardTrimRedeemed", "birthMonth", "birthdayBonusYear", "lastQuarterlyVoucherQuarter"
    })
    private User user;

    // Set only when user is null — the contact details a guest gave at
    // booking time, since there's no account to look them up from.
    @Column(name = "guest_name")
    private String guestName;

    @Column(name = "guest_email")
    private String guestEmail;

    @Column(name = "guest_phone")
    private String guestPhone;

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

    // BK-047: caps how many times this booking can be moved (see
    // BookingService.MAX_RESCHEDULES) instead of allowing indefinite
    // reschedule churn on a single slot.
    @Column(name = "reschedule_count", nullable = false)
    private Integer rescheduleCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Optimistic lock: two concurrent /complete (or cancel/reschedule)
    // requests on the same booking both read the same row, but only the
    // first save() succeeds — the second gets a stale-version exception
    // instead of silently re-running the status transition and, for
    // /complete, awarding points twice (BK-032).
    @Version
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Long version;

    public enum BookingStatus {
        PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
    }

    public Booking() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }
    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }
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
    public Integer getRescheduleCount() { return rescheduleCount; }
    public void setRescheduleCount(Integer rescheduleCount) { this.rescheduleCount = rescheduleCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Long getVersion() { return version; }
}
