package com.hyecuts.loyalty.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Entity
@Table(name = "users")
@JsonIgnoreProperties(value = {"hibernateLazyInitializer", "handler", "referredBy"}, ignoreUnknown = true)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "current_points", nullable = false)
    private Integer currentPoints = 0;

    @Column(name = "lifetime_points", nullable = false)
    private Integer lifetimePoints = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tier tier = Tier.MEMBER;

    @Column(name = "last_beard_trim_redeemed")
    private LocalDate lastBeardTrimRedeemed;

    @Column(name = "birth_month")
    private Integer birthMonth;

    @Column(name = "birthday_bonus_year")
    private Integer birthdayBonusYear;

    @Column(name = "last_quarterly_voucher_quarter", length = 10)
    private String lastQuarterlyVoucherQuarter;

    @Column(name = "referral_code", unique = true)
    private String referralCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referred_by_id")
    private User referredBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "role", nullable = false)
    private String role = "ROLE_USER";

    @Column(name = "username", unique = true)
    private String username;

    @Column(name = "dob")
    private String dob;

    @Column(name = "phone")
    private String phone;

    @Column(name = "hair_type")
    private String hairType;

    @Column(name = "hair_length")
    private String hairLength;

    @Column(name = "hair_scalp")
    private String hairScalp;

    @Column(name = "avatar", length = 1000000)
    private String avatar;

    // Null for accounts created via local password registration. Set to the
    // provider id (e.g. "google") for accounts created via OAuth2 — used to
    // decide whether it's safe to auto-link an OAuth login to an existing
    // account with the same email (see CustomOAuth2UserService).
    @Column(name = "oauth_provider")
    private String oauthProvider;

    public User() {}

    // Special setter to handle the hairProfile object from frontend
    @JsonProperty("hairProfile")
    public void setHairProfile(Map<String, String> hairProfile) {
        if (hairProfile != null) {
            this.hairType = hairProfile.get("type");
            this.hairLength = hairProfile.get("length");
            this.hairScalp = hairProfile.get("scalp");
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Integer getCurrentPoints() { return currentPoints; }
    public void setCurrentPoints(Integer currentPoints) { this.currentPoints = currentPoints; }
    public Integer getLifetimePoints() { return lifetimePoints; }
    public void setLifetimePoints(Integer lifetimePoints) { this.lifetimePoints = lifetimePoints; }
    public Tier getTier() { return tier; }
    public void setTier(Tier tier) { this.tier = tier; }
    public LocalDate getLastBeardTrimRedeemed() { return lastBeardTrimRedeemed; }
    public void setLastBeardTrimRedeemed(LocalDate lastBeardTrimRedeemed) { this.lastBeardTrimRedeemed = lastBeardTrimRedeemed; }
    public Integer getBirthMonth() { return birthMonth; }
    public void setBirthMonth(Integer birthMonth) { this.birthMonth = birthMonth; }
    public Integer getBirthdayBonusYear() { return birthdayBonusYear; }
    public void setBirthdayBonusYear(Integer birthdayBonusYear) { this.birthdayBonusYear = birthdayBonusYear; }
    public String getLastQuarterlyVoucherQuarter() { return lastQuarterlyVoucherQuarter; }
    public void setLastQuarterlyVoucherQuarter(String lastQuarterlyVoucherQuarter) { this.lastQuarterlyVoucherQuarter = lastQuarterlyVoucherQuarter; }
    public String getReferralCode() { return referralCode; }
    public void setReferralCode(String referralCode) { this.referralCode = referralCode; }
    public User getReferredBy() { return referredBy; }
    public void setReferredBy(User referredBy) { this.referredBy = referredBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getHairType() { return hairType; }
    public void setHairType(String hairType) { this.hairType = hairType; }
    public String getHairLength() { return hairLength; }
    public void setHairLength(String hairLength) { this.hairLength = hairLength; }
    public String getHairScalp() { return hairScalp; }
    public void setHairScalp(String hairScalp) { this.hairScalp = hairScalp; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getOauthProvider() { return oauthProvider; }
    public void setOauthProvider(String oauthProvider) { this.oauthProvider = oauthProvider; }
}
