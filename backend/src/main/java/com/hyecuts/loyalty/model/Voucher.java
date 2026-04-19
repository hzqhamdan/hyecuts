package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
public class Voucher {
    @Id
    @Column(nullable = false, unique = true, length = 12)
    private String id; // E.g. "V-8F92A" for scanning

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reward_id", nullable = false)
    private Reward reward;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VoucherStatus status = VoucherStatus.ACTIVE;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "redeemed_at")
    private LocalDateTime redeemedAt;

    public enum VoucherStatus {
        ACTIVE, REDEEMED, EXPIRED
    }

    public Voucher() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Reward getReward() { return reward; }
    public void setReward(Reward reward) { this.reward = reward; }
    public VoucherStatus getStatus() { return status; }
    public void setStatus(VoucherStatus status) { this.status = status; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
    public LocalDateTime getRedeemedAt() { return redeemedAt; }
    public void setRedeemedAt(LocalDateTime redeemedAt) { this.redeemedAt = redeemedAt; }
}
