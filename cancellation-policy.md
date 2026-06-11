# The Studio — Booking Cancellation Policy

> Status: \*\*Decided\*\* · Last updated: June 2026

\---

## Policy Rules

|Scenario|Window|Penalty|
|-|-|-|
|On-time cancellation|More than 24h before appointment|None — fully free|
|Late cancellation|Within 24h of appointment|-10 points from `points\_balance`|
|No-show|Appointment time passes, no cancellation made|-20 points from `points\_balance`|

\---

## Penalty Behaviour

* Penalties are deducted from **`points\_balance` only** — the spendable balance.
* **`points\_lifetime` is never affected** by penalties. A member cannot be demoted to a lower tier due to a cancellation or no-show.
* If `points\_balance` would drop below 0, the deduction is applied down to a floor of 0 — no negative balances.
* Penalties are recorded in the `points\_ledger` table with reason code `CANCELLATION\_PENALTY`.

\---

## Booking Restriction

Members who no-show are flagged via a `booking\_restricted\_until` column on the `users` table. The restriction duration is:

* **No-show:** Restricted for **7 days** from the missed appointment date.
* **Late cancellation:** No booking restriction — points penalty only.

During a restriction period, the booking API returns a `403` with a clear message and the restriction expiry date so the frontend can surface it to the member.

\---

## Tier Grace Allowances

Not implemented in v1. Deferred until the tier system is fully operational and usage data is available to calibrate fairness. To be revisited in v2.

\---

## PDPA Note

The cancellation policy (including the points penalty amounts and restriction duration) must be explicitly surfaced to the member at booking confirmation time and acknowledged before the booking is finalised. It must not be buried in a generic Terms of Service.

\---

## Implementation Notes

### New `PointsReason` enum value

Add `CANCELLATION\_PENALTY` to the existing enum:

```java
public enum PointsReason {
    SERVICE\_COMPLETION, FIRST\_BOOKING, BIRTHDAY,
    REFERRAL\_GIVEN, REFERRAL\_RECEIVED, REVIEW,
    SPEND\_THRESHOLD, MISSION\_COMPLETE, ADMIN\_ADJUSTMENT,
    REDEMPTION, EXPIRY,
    CANCELLATION\_PENALTY   // ← add this
}
```

Also add to the `points\_ledger` CHECK constraint in `V2\_\_create\_points\_ledger.sql`:

```sql
CHECK (reason IN (
    'SERVICE\_COMPLETION','FIRST\_BOOKING','BIRTHDAY',
    'REFERRAL\_GIVEN','REFERRAL\_RECEIVED','REVIEW',
    'SPEND\_THRESHOLD','MISSION\_COMPLETE','ADMIN\_ADJUSTMENT',
    'REDEMPTION','EXPIRY',
    'CANCELLATION\_PENALTY'   -- ← add this
))
```

### `booking\_restricted\_until` column

Add to `users` table via a new migration `V5\_\_add\_booking\_restriction.sql`:

```sql
ALTER TABLE users
    ADD COLUMN booking\_restricted\_until TIMESTAMPTZ;
```

### Penalty logic (service layer)

Cancellation penalty flows through the existing `PointsService.awardPoints()` with a negative delta:

```java
// Late cancellation
pointsService.awardPoints(
    userId, -10, PointsReason.CANCELLATION\_PENALTY,
    bookingId, null
);

// No-show — deduct points and set restriction
pointsService.awardPoints(
    userId, -20, PointsReason.CANCELLATION\_PENALTY,
    bookingId, null
);
user.setBookingRestrictedUntil(Instant.now().plus(7, ChronoUnit.DAYS));
userRepository.save(user);
```

> Points balance floor of 0 must be enforced inside `awardPoints()` — adjust the existing negative balance check to clamp rather than throw when the reason is `CANCELLATION\_PENALTY`.

\---

## Open Items

* \[ ] Confirm no-show restriction duration (7 days is the current default — adjust if needed)
* \[ ] Decide whether repeated no-shows escalate the restriction duration
* \[ ] Confirm the exact wording of the cancellation policy shown to members at booking confirmation (PDPA requirement)

