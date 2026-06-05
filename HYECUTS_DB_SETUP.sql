-- Hyecuts Full Database Setup Script
-- Database: hyecuts

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS tiers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    points_required INT NOT NULL,
    discount_multiplier DECIMAL(3,2) NOT NULL,
    benefits_description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    current_points INT NOT NULL DEFAULT 0,
    lifetime_points INT NOT NULL DEFAULT 0,
    tier_id BIGINT REFERENCES tiers(id),
    referral_code VARCHAR(255) UNIQUE,
    referred_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    role VARCHAR(255) NOT NULL DEFAULT 'ROLE_USER',
    dob VARCHAR(255),
    phone VARCHAR(255),
    hair_type VARCHAR(255),
    hair_length VARCHAR(255),
    hair_scalp VARCHAR(255),
    avatar TEXT
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    amount INT NOT NULL,
    transaction_type VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    min_tier_id BIGINT REFERENCES tiers(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    stock_count INT
);

CREATE TABLE IF NOT EXISTS vouchers (
    id VARCHAR(12) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    reward_id UUID NOT NULL REFERENCES rewards(id),
    status VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    redeemed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS badge (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    icon_url VARCHAR(255),
    category VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS mission (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(255),
    type VARCHAR(255),
    reward_points INT,
    target_action VARCHAR(255),
    required_count INT
);

CREATE TABLE IF NOT EXISTS user_badge (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    badge_id BIGINT,
    earned_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_mission_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    mission_id BIGINT,
    current_progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS global_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS barber_services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price_myr DECIMAL(10,2) NOT NULL,
    base_points INT NOT NULL,
    duration_minutes INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    service_id BIGINT NOT NULL REFERENCES barber_services(id),
    appointment_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(255) NOT NULL,
    total_price_myr DECIMAL(10,2) NOT NULL,
    points_awarded INT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- 2. Seed Initial Tiers (Crucial for the Loyalty Engine)
INSERT INTO tiers (name, points_required, discount_multiplier, benefits_description) VALUES
('Rookie', 0, 1.00, 'Baseline membership.'),
('Regular', 1000, 0.95, '5% discount on all services.'),
('Legend', 2500, 0.90, '10% discount on all services.'),
('Master', 5000, 0.85, '15% discount + priority booking.'),
('Icon', 10000, 0.80, '20% discount + exclusive events.')
ON CONFLICT (name) DO NOTHING;

-- 3. Seed Global Economy Settings
INSERT INTO global_settings (setting_key, setting_value, description) VALUES
('POINT_RATIO', '10', 'Points awarded per 1 RM spent'),
('SEASONAL_MULTIPLIER', '1.0', 'Global multiplier for all point earnings')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Seed Barber Services
INSERT INTO barber_services (name, description, price_myr, base_points, duration_minutes, is_active) VALUES
('Adult Hair Cut', 'Precision cut tailored to your style.', 25.00, 250, 30, TRUE),
('Cut & Shave', 'Signature cut and traditional shave.', 30.00, 300, 30, TRUE),
('Keratin Treatment', 'Premium hair treatment for smoothing and repair.', 200.00, 2000, 120, TRUE),
('Teenager Hair Cut', 'Stylish haircut for teens.', 20.00, 200, 30, TRUE),
('Senior Citizen Hair Cut', 'Classic haircut for senior citizens.', 15.00, 150, 30, TRUE),
('Senior Cut & Shave', 'Haircut and shave for senior citizens.', 20.00, 200, 40, TRUE),
('Kids Hair Cut', 'Gentle and neat cuts for kids.', 15.00, 150, 30, TRUE),
('Beard Trim/Shape', 'Quick trim and styling for your beard.', 10.00, 100, 10, TRUE),
('Shave/Clean', 'Clean shave service.', 10.00, 100, 10, TRUE),
('Hair Colour', 'Full hair coloring service.', 180.00, 1800, 180, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Note: The admin and services will be seeded automatically by the Spring Boot app 
-- (DatabaseSeeder.java) when it detects the tables are empty.
