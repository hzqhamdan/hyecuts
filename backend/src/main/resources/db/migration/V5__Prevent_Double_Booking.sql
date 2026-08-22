-- Application-level checks in BookingService can still race under concurrent
-- requests (two requests both read "slot free" before either writes). Only a
-- DB-level constraint closes that race. Cancelled bookings free the slot back up.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_active_appointment_time
    ON bookings (appointment_time)
    WHERE status <> 'CANCELLED';
