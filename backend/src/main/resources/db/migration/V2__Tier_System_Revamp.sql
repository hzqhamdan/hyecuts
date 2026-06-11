-- Revamp tier system: replace DB-backed tiers with enum; track benefits

-- 1. Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier VARCHAR(20) NOT NULL DEFAULT 'MEMBER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_beard_trim_redeemed DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_month INT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday_bonus_year INT;

-- 2. Migrate existing tier data from tier_id to tier column
UPDATE users u
SET tier = CASE
    WHEN t.name = 'Rookie' THEN 'MEMBER'
    WHEN t.name = 'Regular' THEN 'INSIDER'
    WHEN t.name = 'Legend' THEN 'ARTISAN'
    WHEN t.name = 'Master' THEN 'CONNOISSEUR'
    WHEN t.name = 'Icon' THEN 'PATRON'
    ELSE 'MEMBER'
END
FROM tiers t
WHERE u.tier_id = t.id;

-- 3. Drop old tier_id column from users
ALTER TABLE users DROP COLUMN IF EXISTS tier_id;

-- 4. Update rewards: migrate min_tier_id to min_tier string
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS min_tier VARCHAR(20);

UPDATE rewards r
SET min_tier = CASE
    WHEN t.name = 'Rookie' THEN 'MEMBER'
    WHEN t.name = 'Regular' THEN 'INSIDER'
    WHEN t.name = 'Legend' THEN 'ARTISAN'
    WHEN t.name = 'Master' THEN 'CONNOISSEUR'
    WHEN t.name = 'Icon' THEN 'PATRON'
    ELSE NULL
END
FROM tiers t
WHERE r.min_tier_id = t.id;

ALTER TABLE rewards DROP COLUMN IF EXISTS min_tier_id;

-- 5. Drop old tiers table
DROP TABLE IF EXISTS tiers CASCADE;

-- 6. Update global settings for new earn rate (1 MYR = 1 point)
INSERT INTO global_settings (setting_key, setting_value, description) VALUES
('POINTS_PER_MYR', '1', 'Points earned per 1 MYR spent (1:1 rate)')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = '1', description = 'Points earned per 1 MYR spent (1:1 rate)';

-- 7. Add new configurable settings for benefits
INSERT INTO global_settings (setting_key, setting_value, description) VALUES
('BIRTHDAY_BONUS_POINTS', '100', 'Points awarded for birthday bonus (Connoisseur/Patron)')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO global_settings (setting_key, setting_value, description) VALUES
('INSIDER_BONUS_PERCENT', '10', 'Bonus percentage applied to point earnings for Insider+ tiers')
ON CONFLICT (setting_key) DO NOTHING;
