# Booking Flow — QA Test Matrix & Vulnerability Report

**Project:** Hyecuts Barbershop Loyalty  
**Scope:** Booking CRUD (create, reschedule, cancel, complete), status transitions, user queries, date range queries, race conditions, business logic abuse, parameter pollution, mass assignment  
**Analysis Date:** 2026-06-24  
**Tester:** Senior QA Engineer / Red-team Security Engineer  
**Assumption:** Every user is malicious. Frontend validation is not trusted. All endpoints are `.permitAll()` unless noted.

---

## Section 1: QA Test Matrix

| ID | Feature | Input | Expected Result | Actual Risk | Priority | Test Type |
|---|---|---|---|---|---|---|
| BOK-001 | Create booking | Valid userId, serviceId, future appointmentTime | 200 with Booking object | No slot availability check — duplicate slot not rejected | C | Happy |
| BOK-002 | Create booking | Missing serviceId (null) | 400 "Service not found" | Null serviceId causes NPE in `service.getName()` on other paths | H | Sad |
| BOK-003 | Create booking | Missing appointmentTime (null) | 500 — `LocalDateTime.parse(null)` throws NPE | No null check on appointmentTime; 500 error with stack trace | C | Sad |
| BOK-004 | Create booking | Missing userId (null) | 400 "User not found" | Checked via `userRepository.findById()` returning null | M | Sad |
| BOK-005 | Create booking | Past date (yesterday) | 200 — booking created with past time | **No past-date validation** — booking can be created in the past | C | Edge |
| BOK-006 | Create booking | Non-existent userId (valid UUID format) | 400 "User not found" | Properly handled | M | Sad |
| BOK-007 | Create booking | Non-existent serviceId (valid Long) | 400 "Service not found" | Properly handled | M | Sad |
| BOK-008 | Create booking | SQL injection in serviceId: `1 OR 1=1` | 200 or crash — Long.parseLong throws NumberFormatException | Spring MVC returns 400 before controller is reached | M | Security |
| BOK-009 | Create booking | SQL injection in appointmentTime | 500 — `LocalDateTime.parse` throws | Not a SQL injection vector; but unhandled exception returns 500 | M | Security |
| BOK-010 | Create booking | XSS in appointmentTime: `<script>alert(1)</script>` | 500 — parse error | Error message may be reflected in 400/500 response body | M | Security |
| BOK-011 | Create booking | appointmentTime with emoji: `2024-01-01T10:00:00😀` | 500 — parse error | Unhandled exception; 500 returned | M | Edge |
| BOK-012 | Create booking | Duplicate booking same user + same time slot | 200 — both bookings created successfully | **No uniqueness constraint** on `(user_id, appointment_time)` — double-booking succeeds | C | Edge |
| BOK-013 | Create booking | Service with `isActive = false` | 200 — booking created with inactive service | **No check for service.isActive** — clients can book inactive services | H | Security |
| BOK-014 | Create booking | appointmentTime outside business hours (3:00 AM) | 200 — booking created outside hours | **No business hours validation** — booking at 3 AM succeeds | H | Edge |
| BOK-015 | Create booking | appointmentTime on closed day (Sunday) | 200 — booking created on closed day | **No day-of-week validation** — booking on closed day succeeds | H | Edge |
| BOK-016 | Create booking | appointmentTime = Feb 29 on non-leap year | 500 — `LocalDateTime.parse` throws | Unhandled exception | M | Edge |
| BOK-017 | Create booking | appointmentTime = Feb 29 on leap year (2024-02-29T14:00:00) | 200 — should be accepted | Valid date, works correctly | L | Edge |
| BOK-018 | Create booking | appointmentTime at DST spring-forward boundary | 200 or 500 depending on zone | JVM timezone handling; potential off-by-one-hour | M | Edge |
| BOK-019 | Create booking | appointmentTime at DST fall-back boundary | 200 — ambiguous time resolved by JVM | Default timezone behavior may produce unexpected time | M | Edge |
| BOK-020 | Create booking | appointmentTime in far future (year 9999) | 200 — accepted | Database may reject depending on column type (TIMESTAMP range) | M | Edge |
| BOK-021 | Create booking | appointmentTime = year 0001 | 500 — out of SQL TIMESTAMP range | Database constraint failure; 500 error | M | Edge |
| BOK-022 | Create booking | Empty body `{}` | 500 — NPE on userId/serviceId/appointmentTime | No validation on request body fields; 500 with stack trace | C | Sad |
| BOK-023 | Create booking | appointmentTime in non-ISO format: `10/10/2024 2:00 PM` | 500 — `DateTimeParseException` | Unhandled exception leaks format details | M | Edge |
| BOK-024 | Reschedule | Valid new date (future) | 200 — booking rescheduled | Works correctly for valid input | L | Happy |
| BOK-025 | Reschedule | New date = same as current | 200 — booking rescheduled to same time | Idempotent, but should be allowed | L | Edge |
| BOK-026 | Reschedule | New date is in the past | 200 — rescheduled to past date | **No past-date validation on reschedule** | H | Edge |
| BOK-027 | Reschedule | Booking is already CANCELLED | 400 "Cannot reschedule a completed or cancelled booking" | Properly guarded | M | Sad |
| BOK-028 | Reschedule | Booking is already COMPLETED | 400 "Cannot reschedule a completed or cancelled booking" | Properly guarded | M | Sad |
| BOK-029 | Reschedule | Non-existent bookingId | 500 — `RuntimeException("Booking not found")` | Unhandled exception returns 500 with message | H | Sad |
| BOK-030 | Reschedule | newAppointmentTime = null | 500 — NPE | No null check | H | Sad |
| BOK-031 | Reschedule | Leap year Feb 29 reschedule target | 200 — works for valid Feb 29 | Depends on year | L | Edge |
| BOK-032 | Reschedule | DST transition date | 200 — JVM handles timezone | Potential off-by-one if timezone not considered | M | Edge |
| BOK-033 | Cancel | Valid booking (PENDING) | 200 — status changed to CANCELLED | Works correctly | M | Happy |
| BOK-034 | Cancel | Already CANCELLED booking | 200 — `cancelBooking` succeeds again | `cancelBooking` only checks for COMPLETED, not CANCELLED — no-op but succeeds | M | Edge |
| BOK-035 | Cancel | Already COMPLETED booking | 400 "Cannot cancel a completed booking" | Properly guarded | M | Sad |
| BOK-036 | Cancel | Non-existent bookingId | 500 — RuntimeException | Unhandled exception; 500 returned | H | Sad |
| BOK-037 | Cancel | Another user's booking (User A cancels User B's) | 200 — cancellation succeeds | **No ownership check** — User A can cancel User B's booking | C | Security |
| BOK-038 | Complete | Valid booking (PENDING/CONFIRMED/NO_SHOW) | 200 — status changed to COMPLETED, points awarded | Works; but NO_SHOW and PENDING can be completed directly | M | Happy |
| BOK-039 | Complete | Already COMPLETED booking | 400 "Booking is already completed." | Properly guarded | M | Sad |
| BOK-040 | Complete | Non-existent bookingId | 500 — RuntimeException | Unhandled exception | H | Sad |
| BOK-041 | Complete | Another user's booking | 200 — User A completes User B's booking, User B gets points | No ownership check; points awarded to wrong user | C | Security |
| BOK-042 | Complete | Verify points calculation: price × pointsPerMyr | Points awarded = price × global setting | Points calculation simplified — no tier multiplier applied here | M | Happy |
| BOK-043 | Complete | GlobalSettings returns 0 for POINTS_PER_MYR | 0 points awarded | Setting of 0 leads to 0 points | L | Edge |
| BOK-044 | Complete | GlobalSettings returns malformed value (non-numeric) | Default 10 used | Graceful fallback in GlobalSettingsService | L | Edge |
| BOK-045 | User query | Valid userId with bookings | 200 — list of bookings | Works correctly | L | Happy |
| BOK-046 | User query | Non-existent userId (valid UUID) | 200 — empty list | Returns empty list; no indication of missing user | L | Sad |
| BOK-047 | User query | SQL injection: `/api/bookings/user/1 OR 1=1--` | 400 — UUID parse error | UUID format validation prevents injection | M | Security |
| BOK-048 | User query | Malformed UUID: `not-a-uuid` | 400 — TypeMismatchException | Spring Boot returns 400 for invalid UUID | M | Sad |
| BOK-049 | User query | Another user's userId | 200 — returns other user's booking data | **No authenticated user check** — leaking other users' bookings | C | Security |
| BOK-050 | Date range | Valid date: `2024-06-24` | 200 — bookings for that date | Works correctly | M | Happy |
| BOK-051 | Date range | Malformed date: `not-a-date` | 500 — `DateTimeParseException` | Unhandled exception; 500 returned with stack trace | H | Sad |
| BOK-052 | Date range | SQL injection in date path: `2024-01-01 OR 1=1` | 500 — parse error | Date format validation prevents injection | M | Security |
| BOK-053 | Date range | Very wide range via `/all` endpoint | 200 — all bookings | No pagination; potential performance issue | M | Edge |
| BOK-054 | Status: PENDING → CONFIRMED | No CONFIRMED endpoint exists | No status transition to CONFIRMED possible via API | CONFIRMED status can only be set directly in DB | M | Edge |
| BOK-055 | Status: PENDING → CANCELLED | Valid cancellation | 200 — cancelled | Works | M | Happy |
| BOK-056 | Status: PENDING → COMPLETED | Direct complete of PENDING booking | 200 — completed | PENDING bookings can be completed without going through CONFIRMED | H | Edge |
| BOK-057 | Status: COMPLETED → CANCELLED | Cancel completed booking | 400 "Cannot cancel a completed booking" | Properly guarded | M | Sad |
| BOK-058 | Status: CANCELLED → COMPLETED | Complete cancelled booking | 200 — completed | `completeBooking` only checks for COMPLETED status, not CANCELLED — state transition from CANCELLED to COMPLETED is allowed | H | Security |
| BOK-059 | Status: NO_SHOW → COMPLETED | Complete a NO_SHOW booking | 200 — completed | `completeBooking` only checks COMPLETED; NO_SHOW can be completed to award points | H | Edge |
| BOK-060 | Race: two concurrent bookings same slot | Two simultaneous POST requests same time+barber | Both succeed — double booking | **No pessimistic/optimistic locking** on slot uniqueness | C | Security |
| BOK-061 | Race: concurrent cancel + complete | Cancel and complete same booking simultaneously | One succeeds, other may fail or succeed based on order | No locking; both could succeed if race window is right | H | Security |
| BOK-062 | Race: concurrent reschedule + complete | Reschedule and complete same booking | Both succeed or one fails | No locking; race could lead to inconsistent state | H | Security |
| BOK-063 | Price manipulation | Request includes additional `totalPriceMyr` field | `totalPriceMyr` is set from `service.getPriceMyr()` in controller — overridden | Controller correctly ignores request body totalPriceMyr and uses service price | L | Security |
| BOK-064 | Mass assignment: userId | Inject different userId in request body | `newBooking.setUser(user)` uses controller's looked-up user — mitigated | Controller resolves userId from DB, not from request body beyond the explicit field | M | Security |
| BOK-065 | Mass assignment: status | Inject `status: "COMPLETED"` in request body | `newBooking.setStatus(PENDING)` overrides any injected status | Controller explicitly sets PENDING — mitigated | M | Security |
| BOK-066 | Mass assignment: pointsAwarded | Inject `pointsAwarded: 9999` in body | Ignored — never set during creation | Points only set in completeBooking | L | Security |
| BOK-067 | Parameter pollution | Request with extra fields: `{"userId":"...","serviceId":1,"appointmentTime":"...","isAdmin":true}` | Extra fields ignored by Jackson | No effect; Jackson ignores unknown fields by default | L | Security |
| BOK-068 | Bypass payment step | Call `POST /api/bookings` directly without PaymentStep | Booking created with PENDING status | **No payment validation** — "Pay at Shop" option is intentional; no payment-gated flow | H | Security |
| BOK-069 | Guest booking token | Window closes; guest flow sets `bookingRef` from `Date.now()` | No backend call made; fake reference created | Guest booking produces fake reference HYC-XXXX without actual server-side booking | H | Edge |
| BOK-070 | Guest booking creates no backend record | Guest completes flow without login | Step 6 shows fake ref; no DB record created | Guest "bookings" are entirely client-side and never persisted | C | Security |
| BOK-071 | Unauthenticated access to `/api/bookings/all` | No Authorization header | 200 — all bookings returned | `.anyRequest().permitAll()` — no auth needed | C | Security |
| BOK-072 | Double-click confirm | User rapidly clicks "Pay at Shop" twice | Two POST /api/bookings requests sent | **No debounce on frontend** — two identical bookings created | H | Edge |
| BOK-073 | Reschedule to already-booked slot | New time matches existing PENDING booking | 200 — double-booked slot created | **No slot conflict check on reschedule** | H | Security |
| BOK-074 | Reschedule with bookingId = empty string | `PUT /api/bookings//reschedule` | 405 or 404 — path not matched | Spring MVC correctly rejects empty path variable | L | Sad |
| BOK-075 | Cancel with UUID of other entity type | `PUT /api/bookings/{randomUUID}/cancel` | 500 — "Booking not found" | Returns 500 instead of 404 | M | Edge |
| BOK-076 | Delete booking — no endpoint | `DELETE /api/bookings/{id}` | 405 Method Not Allowed | No delete endpoint exists — bookings are immutable once created | M | Edge |
| BOK-077 | Very long appointmentTime string | 10,000 character appointmentTime | 500 — parse failure | Potential DoS on DateTimeParse with pathological input | H | Security |
| BOK-078 | Repeated date range queries | 1000 rapid requests to `/api/bookings/date/2024-06-24` | All succeed | **No rate limiting** — can hammer date endpoint | C | Security |
| BOK-079 | CSRF booking creation | Cross-site POST to /api/bookings | Succeeds — CSRF is disabled | Attacker can create bookings on victim's behalf via XHR | C | Security |
| BOK-080 | Points double-claim via race | Concurrent completeBooking on same bookingId | Points awarded twice if both pass the status check | `completeBooking` is not idempotent — race condition leads to double points | C | Security |

---

## Section 2: Vulnerability Report

| # | Vulnerability Title | Attack Scenario | Steps to Reproduce | Impact | Severity | Recommended Fix | Example Exploit Payload |
|---|---|---|---|---|---|---|---|
| V-01 | **No Ownership Checks on Booking Operations** | User A can cancel, complete, or reschedule User B's booking because no controller method verifies the booking's `user.id` matches the authenticated user. The service layer has no ownership check either. | 1. User A logs in and gets bookingId `aaa...` for their own booking<br>2. User B logs in and gets bookingId `bbb...` for their booking<br>3. User A calls `PUT /api/bookings/bbb.../cancel`<br>4. User B's booking is cancelled by User A | Full unauthorized modification of any user's bookings; data integrity compromise | **Critical** | Extract authenticated user from JWT in each controller method. Compare `booking.getUser().getId()` against authenticated user ID. Add `@PreAuthorize` or manual check in every booking mutation endpoint. | `curl -X PUT "https://api.hyecuts.com/api/bookings/$(victimBookingId)/cancel"` |
| V-02 | **Race Condition on Double-Booking Same Time Slot** | Two concurrent POST requests for the same barber/time slot both pass the (non-existent) availability check and both create bookings. No unique constraint exists on `(user_id, appointment_time)` or any barber+time combination. | 1. Open two terminal windows<br>2. Send `POST /api/bookings` simultaneously with same `appointmentTime` and same `serviceId`<br>3. Both return 200 with distinct booking IDs | Double-booking — two customers assigned same slot; no inventory integrity | **Critical** | Add database-level unique constraint on `(barber_id, appointment_time)`. Use `@Version` optimistic locking or pessimistic `SELECT FOR UPDATE` in a transactional service method. Add slot availability check before insert. | `for i in 1 2; do curl -X POST https://api.hyecuts.com/api/bookings -H 'Content-Type: application/json' -d '{"userId":"...","serviceId":1,"appointmentTime":"2024-06-24T14:00:00"}' &; done` |
| V-03 | **Status Transition Abuse — Complete a Cancelled Booking** | `completeBooking` only checks if status `== COMPLETED`. It does not check if status is `CANCELLED`, `NO_SHOW`, or `PENDING`. A cancelled booking can be completed to award fraudulent points. | 1. Create booking → status PENDING<br>2. Cancel booking → status CANCELLED<br>3. Call `PUT /api/bookings/{id}/complete`<br>4. Booking goes from CANCELLED → COMPLETED and points are awarded | Fraudulent point earning on cancelled bookings; points awarded for service not rendered | **High** | In `completeBooking()`, check that current status is not CANCELLED or NO_SHOW. Only allow CONFIRMED → COMPLETED transition. Use a state machine pattern. | `curl -X PUT "https://api.hyecuts.com/api/bookings/$(cancelledBookingId)/complete"` |
| V-04 | **No Past-Date Validation on Create or Reschedule** | The controller accepts `appointmentTime` values in the past with zero validation. Neither `createBooking` nor `rescheduleBooking` checks that the time is in the future. | 1. Send `POST /api/bookings` with `appointmentTime: "2020-01-01T10:00:00"`<br>2. Booking created with past date<br>3. Similarly reschedule to past date | Historical bookings created; scheduling chaos; audit trail integrity compromised | **High** | Add validation in controller or service: `if (appointmentTime.isBefore(LocalDateTime.now())) { throw new ... }` | `curl -X POST https://api.hyecuts.com/api/bookings -d '{"userId":"...","serviceId":1,"appointmentTime":"2020-01-01T00:00:00"}'` |
| V-05 | **No Business Hours or Closed-Day Validation** | Booking can be created for any time of day or any day of the week. No check against `BUSINESS_HOURS` data or day-of-week rules. | 1. Create booking at `03:00 AM` on a Sunday<br>2. Booking succeeds<br>3. Barber shop is closed | Customers booking at invalid hours; operational disruption | **High** | Add service-layer validation that `appointmentTime` falls within defined business hours and on a valid operating day. Reject out-of-hours bookings. | `curl -X POST https://api.hyecuts.com/api/bookings -d '{"userId":"...","serviceId":1,"appointmentTime":"2024-06-23T03:00:00"}'` |
| V-06 | **No Rate Limiting on Booking Endpoints** | All booking endpoints (`POST /api/bookings`, `PUT /.../cancel`, `PUT /.../reschedule`, `PUT /.../complete`) have zero rate limiting. An attacker can flood the system. | 1. Write script sending 10,000 `POST /api/bookings` requests in parallel<br>2. All succeed<br>3. Database filled with spam bookings; potential DoS | Resource exhaustion; database flooding; spam bookings; degraded service for legitimate users | **High** | Implement rate limiting per IP and per user using Bucket4j, Spring Cloud Gateway rate limiter, or nginx `limit_req`. Add CAPTCHA for booking creation. | `for i in $(seq 1 1000); do curl -X POST https://api.hyecuts.com/api/bookings -d '{"userId":"...","serviceId":1,"appointmentTime":"2024-06-24T14:00:00"}' &; done` |
| V-07 | **No Service Active Check on Booking** | `BookingController.createBooking()` calls `barberServiceService.getServiceById()` but does not check `service.getIsActive()`. Inactive/deleted services can be booked. | 1. Admin deactivates a service (sets `isActive = false`)<br>2. Attacker calls `POST /api/bookings` with the inactive serviceId<br>3. Booking created for a service the shop no longer offers | Customers booking discontinued services; operational confusion | **Medium** | Add check after service lookup: `if (!service.getIsActive()) { return badRequest("Service is not available"); }` | `curl -X POST https://api.hyecuts.com/api/bookings -d '{"userId":"...","serviceId":3,"appointmentTime":"2024-06-24T14:00:00"}'` (where serviceId 3 is inactive) |
| V-08 | **Data Leakage via `/api/bookings/user/{userId}`** | No authentication required and no authorized-user check. Any user (or unauthenticated visitor) can retrieve any other user's full booking history by guessing or enumerating UUIDs. | 1. Attacker calls `GET /api/bookings/user/{victimUUID}`<br>2. Full list of victim's bookings returned with service names, times, prices, statuses<br>3. No auth required (`.anyRequest().permitAll()`) | Full booking history exposure; privacy violation; PII leakage (booking patterns reveal user behavior) | **Critical** | Require authentication on all booking endpoints. Verify the authenticated user's ID matches the path param (or user is admin). | `curl "https://api.hyecuts.com/api/bookings/user/$(victimUUID)"` |
| V-09 | **Booking Created Without Payment — Intentional but Exploitable** | The "Pay at Shop" option creates a booking with PENDING status and no payment record. Combined with no rate limiting, attackers can create unlimited unpaid bookings to block time slots. | 1. Script creates 100 bookings with same time slot but different (or randomized) userIds<br>2. Each is PENDING with zero payment<br>3. All time slots appear "booked"<br>4. Real customers cannot book | Slot squatting; denial of service against legitimate customers; no payment commitment | **Medium** | Add a booking hold expiry mechanism (e.g., PENDING bookings auto-cancel after N minutes). Implement per-user booking limits. Require payment for CONFIRMED status. | `for i in $(seq 1 50); do curl -X POST /api/bookings -d '{"userId":"...","serviceId":1,"appointmentTime":"2024-06-24T14:00:00"}' &; done` |
| V-10 | **Guest Booking Produces Fake Reference with No Backend Record** | When unauthenticated users complete the booking flow, `handleConfirm` sets a fake reference (`HYC-${Date.now()}`) without making any API call. The frontend displays a confirmation screen for a booking that was never persisted. | 1. User does not log in<br>2. Goes through booking flow as guest<br>3. Clicks "Pay at Shop"<br>4. Step 6 shows `HYC-17200...` — no backend booking exists | Customers arrive for appointments that don't exist; zero audit trail; complete UX failure for guest flow | **Critical** | Guest users must either: (a) be prompted to create an account before booking, (b) have a separate guest booking flow that creates a real backend record with a phone number or email for contact, or (c) be redirected to login. Never show a confirmation without a server-side booking record. | N/A — architectural flaw |
| V-11 | **CANCELLED Booking Can Be Re-cancelled (Idempotent No-op)** | `cancelBooking` only checks for `COMPLETED` status. It does not check for `CANCELLED`. Calling cancel on an already-cancelled booking succeeds silently. | 1. Cancel a booking → status CANCELLED<br>2. Call cancel again → 200 with same CANCELLED booking returned<br>3. No error, no indication of idempotency | Minor — but the status check is incomplete and inconsistent with `completeBooking` which correctly guards against double-complete. Indicates poor state machine design. | **Low** | Add check in `cancelBooking()`: `if (booking.getStatus() == CANCELLED) { throw new RuntimeException("Booking is already cancelled."); }` | `curl -X PUT "https://api.hyecuts.com/api/bookings/$(cancelledId)/cancel"` |
| V-12 | **No-SHOW → COMPLETED Transition Allowed** | `completeBooking` only checks `COMPLETED` status. A NO_SHOW booking can be completed to fraudulently earn points for a service the customer never received. | 1. Booking is marked NO_SHOW (customer didn't show)<br>2. Call `PUT /api/bookings/{id}/complete`<br>3. Points awarded as if service was rendered | Fraudulent point earning for no-show appointments; financial loss (points redeemable for real value) | **High** | Add check in `completeBooking()`: reject if status is NO_SHOW or CANCELLED. Only allow CONFIRMED → COMPLETED. | `curl -X PUT "https://api.hyecuts.com/api/bookings/$(noShowBookingId)/complete"` |
| V-13 | **No Input Sanitization on appointmentTime** | `appointmentTime` is parsed via `LocalDateTime.parse()` without try/catch in the controller. Malformed input causes `DateTimeParseException` which is not handled gracefully. | 1. Send `appointmentTime: "not-a-date"`<br>2. `LocalDateTime.parse()` throws<br>3. Exception caught by generic try/catch in reschedule, but not in createBooking<br>4. In createBooking, returns 500 with stack trace | Information disclosure via stack trace; poor error handling | **Medium** | Add proper try/catch in `createBooking`. Return 400 with generic error message. Add `@ExceptionHandler` in `@ControllerAdvice` for `DateTimeParseException`. | `curl -X POST /api/bookings -d '{"userId":"...","serviceId":1,"appointmentTime":"invalid-date"}'` |
| V-14 | **No Idempotency Key on Booking Creation** | Booking creation has no idempotency key. Network retries or double-clicks create duplicate bookings. | 1. User clicks "Pay at Shop" twice rapidly<br>2. Two POST /api/bookings requests sent<br>3. Two identical bookings created for the same user, same time, same service | Duplicate bookings; customer charged/committed twice; manual cleanup required | **Medium** | Implement idempotency key pattern: client generates unique key in `Idempotency-Key` header; server deduplicates within a time window. Disable confirm button after first click. | Send two identical POST requests to `/api/bookings` within 100ms → both succeed |
| V-15 | **Points Double-Awarded via Race Condition on completeBooking** | Two concurrent calls to `completeBooking` with the same `bookingId` can both pass the `status != COMPLETED` check before either sets the status, resulting in points being awarded twice. | 1. Booking is PENDING<br>2. Send two `PUT /api/bookings/{id}/complete` simultaneously<br>3. Both threads read status as PENDING<br>4. Both calculate points, call `addPointsToUser`, and save | User receives double points for a single booking; loyalty program exploit for unlimited points | **Critical** | Add `@Version` field to Booking entity for optimistic locking. Use `synchronized` or `SELECT ... FOR UPDATE` in transactional method. Check-and-set in single atomic operation. | Send two concurrent curl requests: `curl -X PUT "...complete" &; curl -X PUT "...complete" &` |

---

## Summary of Findings

| Severity | Count | Key Issues |
|---|---|---|
| Critical | 6 | No ownership checks on booking ops, race condition double-booking, data leakage via /user/{id}, guest booking creates fake ref, points double-award race, status transition abuse CANCELLED→COMPLETED |
| High | 5 | No past-date validation, no business hours check, no rate limiting, NO_SHOW→COMPLETED transition, no service active check |
| Medium | 4 | No idempotency, no input sanitization, guest booking fake ref, slot squatting via unpaid bookings |
| Low | 1 | CANCELLED re-cancel idempotent no-op |

**Recommended Immediate Actions:**
1. Add ownership checks on ALL booking mutation endpoints — verify `booking.getUser().getId()` against authenticated user
2. Add database-level unique constraint on `(user_id, appointment_time)` — prevent double-booking
3. Implement proper status state machine — reject CANCELLED→COMPLETED and NO_SHOW→COMPLETED transitions
4. Add past-date validation and business hours validation on create + reschedule
5. Fix guest booking flow — never show confirmation without server-side booking record
6. Add `@Version` optimistic locking on Booking entity to prevent race conditions
7. Implement rate limiting on all booking endpoints
8. Add pagination to `/api/bookings/all` and `/api/bookings/user/{userId}`
9. Add idempotency key support on `POST /api/bookings`
10. Replace generic `RuntimeException("Booking not found")` with proper `404` responses via `@ResponseStatus` or `ResponseEntity`
