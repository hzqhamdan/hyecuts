package com.hyecuts.loyalty.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Actor-scoped record of privileged admin actions (points/tier changes).
 * Deliberately separate from ActivityLog, which is user-scoped and only
 * records what happened to a member's balance, not who did it (see
 * qamatrix.md LOG-005/ADM-002/ADM-003). Actor/target identity is copied in
 * as plain strings rather than entity relations, both to keep this table
 * readable as a standalone audit trail even if the account is later
 * anonymized (see LoyaltyService#deleteUser), and to avoid dragging a lazy
 * User relation (and its PII) into every row the way BK-055 did.
 */
@Entity
@Table(name = "admin_audit_log")
public class AdminAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Null means the action was taken by the system (e.g. dev-data seeding)
    // rather than a logged-in admin.
    @Column(name = "actor_id")
    private UUID actorId;

    @Column(name = "actor_email", nullable = false)
    private String actorEmail;

    @Column(name = "target_user_id", nullable = false)
    private UUID targetUserId;

    @Column(name = "target_email", nullable = false)
    private String targetEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdminAction action;

    @Column(nullable = false, length = 500)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum AdminAction {
        POINTS_ADJUSTMENT, TIER_OVERRIDE
    }

    public AdminAuditLog() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getActorId() { return actorId; }
    public void setActorId(UUID actorId) { this.actorId = actorId; }
    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }
    public UUID getTargetUserId() { return targetUserId; }
    public void setTargetUserId(UUID targetUserId) { this.targetUserId = targetUserId; }
    public String getTargetEmail() { return targetEmail; }
    public void setTargetEmail(String targetEmail) { this.targetEmail = targetEmail; }
    public AdminAction getAction() { return action; }
    public void setAction(AdminAction action) { this.action = action; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
