CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(160) UNIQUE,
    mobile VARCHAR(20) UNIQUE,
    password_hash TEXT,
    role VARCHAR(30) NOT NULL DEFAULT 'customer',
    is_mobile_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    dob DATE,
    age_verified_at TIMESTAMP,
    kyc_status VARCHAR(30) NOT NULL DEFAULT 'not_submitted',
    kyc_rejected_reason TEXT,
    kyc_submitted_at TIMESTAMP,
    kyc_reviewed_at TIMESTAMP,
    kyc_reviewed_by UUID REFERENCES users(id),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    refresh_token_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE otp_challenges (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    identifier VARCHAR(160) NOT NULL,
    purpose VARCHAR(40) NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE kyc_submissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    full_name VARCHAR(120) NOT NULL,
    date_of_birth DATE NOT NULL,
    document_type VARCHAR(40) NOT NULL,
    document_number VARCHAR(120) NOT NULL,
    front_image_url TEXT NOT NULL,
    back_image_url TEXT,
    selfie_image_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE addresses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    label VARCHAR(60) NOT NULL,
    recipient_name VARCHAR(120) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    landmark TEXT,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    country VARCHAR(80) NOT NULL DEFAULT 'India',
    pincode VARCHAR(12) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stores (
    id UUID PRIMARY KEY,
    name VARCHAR(140) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    pincode VARCHAR(12) NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    opening_time TIME,
    closing_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE regions (
    id UUID PRIMARY KEY,
    state VARCHAR(80) NOT NULL,
    city VARCHAR(80) NOT NULL,
    pincode VARCHAR(12) NOT NULL,
    is_serviceable BOOLEAN NOT NULL DEFAULT TRUE,
    legal_age INT NOT NULL DEFAULT 21,
    cod_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_start_time TIME,
    delivery_end_time TIME,
    dry_day_block BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE brands (
    id UUID PRIMARY KEY,
    name VARCHAR(140) NOT NULL,
    slug VARCHAR(160) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    country VARCHAR(80),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    icon_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    brand_id UUID NOT NULL REFERENCES brands(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    short_description TEXT,
    long_description TEXT,
    abv NUMERIC(5, 2),
    rating_avg NUMERIC(3, 2) DEFAULT 0,
    rating_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id),
    sku VARCHAR(100) UNIQUE NOT NULL,
    volume_ml INT NOT NULL,
    pack_type VARCHAR(60) NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL,
    sale_price NUMERIC(10, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18,
    barcode VARCHAR(120),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE inventories (
    id UUID PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    stock_qty INT NOT NULL DEFAULT 0,
    reserved_qty INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    is_in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE carts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    coupon_code VARCHAR(40),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts(id),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    saved_for_later BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE coupons (
    id UUID PRIMARY KEY,
    code VARCHAR(40) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(10, 2),
    max_discount NUMERIC(10, 2),
    usage_limit INT,
    per_user_limit INT,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE carts
    ADD CONSTRAINT carts_coupon_code_fkey FOREIGN KEY (coupon_code) REFERENCES coupons(code);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    store_id UUID REFERENCES stores(id),
    address_id UUID NOT NULL REFERENCES addresses(id),
    order_number VARCHAR(40) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    grand_total NUMERIC(10, 2) NOT NULL,
    special_instructions TEXT,
    delivery_slot_start TIMESTAMP,
    delivery_slot_end TIMESTAMP,
    age_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    placed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    variant_id UUID NOT NULL REFERENCES product_variants(id),
    product_name VARCHAR(180) NOT NULL,
    variant_name VARCHAR(120) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL
);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    provider VARCHAR(40) NOT NULL,
    provider_payment_id VARCHAR(120),
    provider_order_id VARCHAR(120),
    method VARCHAR(40) NOT NULL,
    status VARCHAR(30) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    failure_reason TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_partners (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(160),
    vehicle_type VARCHAR(40),
    license_number VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE delivery_assignments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    partner_id UUID NOT NULL REFERENCES delivery_partners(id),
    status VARCHAR(30) NOT NULL,
    assigned_at TIMESTAMP,
    picked_at TIMESTAMP,
    delivered_at TIMESTAMP
);

CREATE TABLE delivery_locations (
    id UUID PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES delivery_assignments(id),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
