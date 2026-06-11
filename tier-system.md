# The Studio — Loyalty Tier System
> Status: **Decided** · Last updated: June 2026

---

## Earn Rate

**1 MYR = 1 point**

Points are awarded based on the MYR value of the service completed. No rounding rules — integer values only (e.g. RM25 haircut = 25 points).

---

## Tier Progression

Tiers are determined by **`points_lifetime`** — the cumulative total of all points ever earned. This value is **never decremented** by redemptions or penalties.

| Tier | Lifetime Points Required | Estimated Time to Reach |
|------|--------------------------|-------------------------|
| Member | 0 | Immediate on signup |
| Insider | 100 | ~4 visits / ~2 months |
| Artisan | 350 | ~14 visits / ~7 months |
| Connoisseur | 750 | ~30 visits / ~15 months |
| Patron | 1,500 | ~60 visits / ~2.5 years |

> Estimates based on average service value of RM25 and visit frequency of once every 2–3 weeks.

---

## Tier Benefits

| Tier | Benefits |
|------|---------|
| **Member** | Access to the loyalty program; earn points on every visit |
| **Insider** | +10% bonus points per service (e.g. RM25 haircut → 27 pts instead of 25) |
| **Artisan** | Free beard trim (RM10 value) once per calendar month |
| **Connoisseur** | Priority booking + free beard trim + birthday bonus points |
| **Patron** | All Connoisseur benefits + complimentary service (≤RM25) once per quarter |

### Benefit notes

- **+10% bonus points (Insider):** Rounded down to nearest integer. Applied at point-award time via `PointsService`.
- **Free beard trim (Artisan, Connoisseur, Patron):** Once per calendar month. Tracked via a `benefit_usage` record or a `last_beard_trim_redeemed_at` timestamp on the user. Resets on the 1st of each month.
- **Priority booking (Connoisseur, Patron):** Gets access to newly opened slots before they are visible to lower tiers. Implemented as a visibility filter on the booking availability API.
- **Birthday bonus points (Connoisseur, Patron):** Awarded once per year during the member's birth month. Amount TBD — to be configured in the Loyalty Configurator at runtime. Only `birth_month` is stored (not full date of birth) for PDPA compliance.
- **Complimentary quarterly service (Patron):** Capped at RM25 (standard haircut equivalent). Issued as a system-generated voucher at the start of each quarter. Expires if unused within the quarter.

---

## Points Balance vs. Lifetime Points

Two separate columns on the `users` table:

| Column | Purpose | Ever decremented? |
|--------|---------|-------------------|
| `points_balance` | Spendable points available for reward redemption | Yes — on redemption and cancellation penalties |
| `points_lifetime` | Tier calculation only | **Never** |

This separation ensures that spending rewards or incurring cancellation penalties never causes a tier demotion.

---

## Schema — Enum Update

Replace the existing `Tier` enum in the tech architecture with:

```java
public enum Tier {
    MEMBER(0), INSIDER(100), ARTISAN(350), CONNOISSEUR(750), PATRON(1500);

    private final int minPoints;
    Tier(int minPoints) { this.minPoints = minPoints; }
    public int getMinPoints() { return minPoints; }

    public static Tier forLifetimePoints(int pts) {
        Tier result = MEMBER;
        for (Tier t : values()) {
            if (pts >= t.minPoints) result = t;
        }
        return result;
    }
}
```

## Schema — Migration Update

Update the `tier` column CHECK constraint in `V1__create_users.sql`:

```sql
tier VARCHAR(20) NOT NULL DEFAULT 'MEMBER'
     CHECK (tier IN ('MEMBER','INSIDER','ARTISAN','CONNOISSEUR','PATRON')),
```

---

## Open Items

- [ ] Confirm birthday bonus points amount (to be set in Loyalty Configurator)
- [ ] Confirm exact priority booking window for Connoisseur/Patron (e.g. 24h early access)
- [ ] Decide whether Artisan free beard trim carries over if unused, or strictly monthly reset
