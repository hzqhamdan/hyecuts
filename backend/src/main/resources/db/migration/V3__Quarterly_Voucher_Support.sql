-- Add quarterly voucher support for Patron tier

-- 1. Add expires_at to vouchers
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;

-- 2. Add last_quarterly_voucher_quarter to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_quarterly_voucher_quarter VARCHAR(10);

-- 3. Create system reward for quarterly complimentary service
INSERT INTO rewards (id, title, description, points_cost, min_tier, is_active, stock_count)
SELECT gen_random_uuid(), 'Quarterly Complimentary Service', 'Complimentary service (up to RM25) for Patron members — issued quarterly.',
0, 'PATRON', TRUE, NULL
WHERE NOT EXISTS (SELECT 1 FROM rewards WHERE title = 'Quarterly Complimentary Service');
