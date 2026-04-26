CREATE TABLE tiers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    points_required INT NOT NULL,
    discount_multiplier DECIMAL(3,2) NOT NULL,
    benefits_description TEXT
);

CREATE TABLE users (
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
    role VARCHAR(255) NOT NULL DEFAULT 'ROLE_USER'
);

CREATE TABLE point_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    amount INT NOT NULL,
    transaction_type VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE rewards (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_cost INT NOT NULL,
    min_tier_id BIGINT REFERENCES tiers(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    stock_count INT
);

CREATE TABLE vouchers (
    id VARCHAR(12) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    reward_id UUID NOT NULL REFERENCES rewards(id),
    status VARCHAR(255) NOT NULL,
    issued_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    redeemed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE badge (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    icon_url VARCHAR(255),
    category VARCHAR(255)
);

CREATE TABLE mission (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description VARCHAR(255),
    type VARCHAR(255),
    reward_points INT,
    target_action VARCHAR(255),
    required_count INT
);

CREATE TABLE user_badge (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    badge_id BIGINT NOT NULL REFERENCES badge(id),
    earned_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE TABLE user_mission_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    mission_id BIGINT NOT NULL REFERENCES mission(id),
    current_progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE global_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT
);

CREATE TABLE barber_services (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price_myr DECIMAL(10,2) NOT NULL,
    base_points INT NOT NULL,
    duration_minutes INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    service_id BIGINT NOT NULL REFERENCES barber_services(id),
    appointment_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status VARCHAR(255) NOT NULL,
    total_price_myr DECIMAL(10,2) NOT NULL,
    points_awarded INT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);
