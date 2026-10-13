BEGIN;

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS house_no TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS apartment_name TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS street_area TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS formatted_address TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS google_map_link TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_contact_name VARCHAR(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_mobile VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 7);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(10, 7);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS google_map_link TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_signature VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  cart_id UUID NOT NULL REFERENCES carts(id),
  address_id UUID NOT NULL REFERENCES addresses(id),
  slot VARCHAR(80),
  payment_method VARCHAR(40) NOT NULL DEFAULT 'Razorpay',
  age_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  snapshot JSONB NOT NULL,
  razorpay_order_id VARCHAR(120) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(120) UNIQUE,
  razorpay_signature VARCHAR(255),
  status VARCHAR(30) NOT NULL DEFAULT 'created',
  failure_reason TEXT,
  metadata JSONB,
  created_order_id UUID REFERENCES orders(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_payment_id_key ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_order_id_key ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_razorpay_payment_id_key ON orders(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

INSERT INTO delivery_partners (id, name, mobile, email, vehicle_type, license_number, is_active)
VALUES ('22222222-2222-2222-2222-222222222222', 'Arjun Rider', '9000000001', 'partner@nearkart.in', 'Bike', 'DL-NEARKART-001', TRUE)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, license_number = EXCLUDED.license_number, is_active = EXCLUDED.is_active;

INSERT INTO stores (id, name, license_number, city, state, pincode, latitude, longitude, opening_time, closing_time, is_active)
VALUES ('33333333-3333-3333-3333-333333333333', 'Near Kart Residency Road Hub', 'LIC-BLR-0001', 'Bangalore', 'Karnataka', '560025', 12.9716, 77.5946, '07:00', '23:00', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, opening_time = EXCLUDED.opening_time, closing_time = EXCLUDED.closing_time, is_active = EXCLUDED.is_active;

INSERT INTO regions (id, state, city, pincode, is_serviceable, legal_age, cod_allowed, delivery_start_time, delivery_end_time, dry_day_block)
VALUES
('44444444-4444-4444-4444-444444444401', 'Karnataka', 'Bangalore', '560038', TRUE, 18, TRUE, '07:00', '23:00', FALSE),
('44444444-4444-4444-4444-444444444402', 'Karnataka', 'Bangalore', '560034', TRUE, 18, TRUE, '07:00', '23:00', FALSE),
('44444444-4444-4444-4444-444444444403', 'Karnataka', 'Bangalore', '560102', TRUE, 18, TRUE, '07:00', '23:00', FALSE)
ON CONFLICT (id) DO UPDATE SET legal_age = EXCLUDED.legal_age, cod_allowed = EXCLUDED.cod_allowed, delivery_start_time = EXCLUDED.delivery_start_time, delivery_end_time = EXCLUDED.delivery_end_time;

INSERT INTO categories (id, name, slug, sort_order, is_active)
VALUES
('55555555-5555-5555-5555-555555555501', 'Vegetables', 'vegetables', 1, TRUE),
('55555555-5555-5555-5555-555555555502', 'Fruits', 'fruits', 2, TRUE),
('55555555-5555-5555-5555-555555555503', 'Dairy & Bakery', 'dairy-bakery', 3, TRUE),
('55555555-5555-5555-5555-555555555504', 'Kitchen Items', 'kitchen-items', 4, TRUE),
('55555555-5555-5555-5555-555555555505', 'Home Groceries', 'home-groceries', 5, TRUE),
('55555555-5555-5555-5555-555555555506', 'Snacks & Drinks', 'snacks-drinks', 6, TRUE),
('55555555-5555-5555-5555-555555555507', 'Home Care', 'home-care', 7, TRUE),
('55555555-5555-5555-5555-555555555508', 'Cleaning Supplies', 'cleaning-supplies', 8, TRUE),
('55555555-5555-5555-5555-555555555509', 'Daily Essentials', 'daily-essentials', 9, TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

INSERT INTO brands (id, name, slug, country, is_active)
VALUES
('66666666-6666-6666-6666-666666666601', 'Fresh Fields', 'fresh-fields', 'India', TRUE),
('66666666-6666-6666-6666-666666666602', 'Farm Basket', 'farm-basket', 'India', TRUE),
('66666666-6666-6666-6666-666666666603', 'Aashirvaad', 'aashirvaad', 'India', TRUE),
('66666666-6666-6666-6666-666666666604', 'Fortune', 'fortune', 'India', TRUE),
('66666666-6666-6666-6666-666666666605', 'Daily Fresh', 'daily-fresh', 'India', TRUE),
('66666666-6666-6666-6666-666666666606', 'Vim', 'vim', 'India', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, country = EXCLUDED.country, is_active = EXCLUDED.is_active;

INSERT INTO products (id, brand_id, category_id, name, slug, short_description, long_description, rating_avg, rating_count, is_active)
VALUES
('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'Country Tomato', 'country-tomato', 'Fresh red tomatoes ideal for curries, salads, and daily cooking.', 'Farm-picked tomatoes with a bright colour and juicy texture, suitable for everyday kitchen prep.', 4.7, 128, TRUE),
('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 'Banana Robusta', 'banana-robusta', 'Naturally sweet bananas packed for everyday snacking.', 'Popular table bananas selected for quick breakfast baskets, smoothies, and lunchbox fruit portions.', 4.6, 234, TRUE),
('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555505', 'Aashirvaad Whole Wheat Atta', 'aashirvaad-whole-wheat-atta', 'Trusted atta for soft rotis and daily family cooking.', 'A pantry staple with consistent quality, suited for chapatis, parathas, and routine monthly grocery baskets.', 4.8, 190, TRUE),
('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', 'Fortune Sunlite Sunflower Oil', 'fortune-sunlite-sunflower-oil', 'Light cooking oil for everyday frying and sauteing.', 'A common kitchen essential for home cooks who want a versatile edible oil for frequent meal prep.', 4.5, 156, TRUE),
('77777777-7777-7777-7777-777777777705', '66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555503', 'Daily Fresh Toned Milk', 'daily-fresh-toned-milk', 'Chilled milk packs for tea, coffee, and breakfast routines.', 'Daily-delivery milk packs designed for quick replenishment of fridge essentials and breakfast staples.', 4.4, 118, TRUE),
('77777777-7777-7777-7777-777777777706', '66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555508', 'Vim Dishwash Liquid', 'vim-dishwash-liquid', 'Grease-cutting dishwash liquid for everyday kitchen cleanup.', 'A reliable dishwashing essential for sinks, utensils, and quick post-meal cleanup in busy homes.', 4.5, 84, TRUE)
ON CONFLICT (id) DO UPDATE SET brand_id = EXCLUDED.brand_id, category_id = EXCLUDED.category_id, name = EXCLUDED.name, slug = EXCLUDED.slug, short_description = EXCLUDED.short_description, long_description = EXCLUDED.long_description, rating_avg = EXCLUDED.rating_avg, rating_count = EXCLUDED.rating_count, is_active = EXCLUDED.is_active, updated_at = NOW();

INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
VALUES
('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '/catalog/country-tomato.jpg', 'Fresh tomatoes', 0),
('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777702', '/catalog/banana-robusta.jpg', 'Banana bunch', 0),
('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777703', '/catalog/aashirvaad-whole-wheat-atta.jpg', 'Whole wheat flour bag', 0),
('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777704', '/catalog/fortune-sunlite-sunflower-oil.jpg', 'Sunflower oil bottle', 0),
('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777705', '/catalog/daily-fresh-toned-milk.jpg', 'Milk packets', 0),
('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777706', '/catalog/vim-dishwash-liquid.jpg', 'Dishwash liquid bottle', 0)
ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, image_url = EXCLUDED.image_url, alt_text = EXCLUDED.alt_text, sort_order = EXCLUDED.sort_order;

UPDATE product_images pi SET image_url = '/catalog/carrot.jpg', alt_text = 'Fresh carrots' FROM products p WHERE pi.product_id = p.id AND p.slug = 'carrot' AND pi.sort_order = 0;
INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
SELECT '88888888-8888-8888-8888-8888888888c1', p.id, '/catalog/carrot.jpg', 'Fresh carrots', 0
FROM products p
WHERE p.slug = 'carrot' AND NOT EXISTS (
  SELECT 1 FROM product_images pi WHERE pi.product_id = p.id AND pi.sort_order = 0
)
ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, image_url = EXCLUDED.image_url, alt_text = EXCLUDED.alt_text, sort_order = EXCLUDED.sort_order;
UPDATE product_images pi SET image_url = '/catalog/preview-add-test-product.jpg', alt_text = 'Fresh produce basket' FROM products p WHERE pi.product_id = p.id AND p.slug = 'preview-add-test-product' AND pi.sort_order = 0;
UPDATE product_images pi SET image_url = '/catalog/test-admin-product.jpg', alt_text = 'Produce market assortment' FROM products p WHERE pi.product_id = p.id AND p.slug = 'test-admin-product' AND pi.sort_order = 0;

INSERT INTO product_variants (id, product_id, sku, volume_ml, pack_type, mrp, sale_price, tax_rate, is_active)
VALUES
('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777701', 'NK-TOM-500', 500, 'g', 38, 32, 5, TRUE),
('99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777701', 'NK-TOM-1KG', 1000, 'g', 72, 62, 5, TRUE),
('99999999-9999-9999-9999-999999999903', '77777777-7777-7777-7777-777777777702', 'NK-BAN-6', 6, 'pcs', 48, 42, 5, TRUE),
('99999999-9999-9999-9999-999999999904', '77777777-7777-7777-7777-777777777702', 'NK-BAN-12', 12, 'pcs', 92, 78, 5, TRUE),
('99999999-9999-9999-9999-999999999905', '77777777-7777-7777-7777-777777777703', 'NK-ATT-5KG', 5000, 'g', 329, 289, 5, TRUE),
('99999999-9999-9999-9999-999999999906', '77777777-7777-7777-7777-777777777703', 'NK-ATT-10KG', 10000, 'g', 649, 579, 5, TRUE),
('99999999-9999-9999-9999-999999999907', '77777777-7777-7777-7777-777777777704', 'NK-OIL-1L', 1000, 'ml', 189, 165, 5, TRUE),
('99999999-9999-9999-9999-999999999908', '77777777-7777-7777-7777-777777777704', 'NK-OIL-5L', 5000, 'ml', 899, 829, 5, TRUE),
('99999999-9999-9999-9999-999999999909', '77777777-7777-7777-7777-777777777705', 'NK-MLK-500', 500, 'ml', 34, 31, 5, TRUE),
('99999999-9999-9999-9999-999999999910', '77777777-7777-7777-7777-777777777705', 'NK-MLK-1L', 1000, 'ml', 74, 68, 5, TRUE),
('99999999-9999-9999-9999-999999999911', '77777777-7777-7777-7777-777777777706', 'NK-VIM-500', 500, 'ml', 125, 109, 18, TRUE),
('99999999-9999-9999-9999-999999999912', '77777777-7777-7777-7777-777777777706', 'NK-VIM-2L', 2000, 'ml', 395, 349, 18, TRUE)
ON CONFLICT (id) DO UPDATE SET product_id = EXCLUDED.product_id, sku = EXCLUDED.sku, volume_ml = EXCLUDED.volume_ml, pack_type = EXCLUDED.pack_type, mrp = EXCLUDED.mrp, sale_price = EXCLUDED.sale_price, tax_rate = EXCLUDED.tax_rate, is_active = EXCLUDED.is_active;

INSERT INTO inventories (id, variant_id, store_id, stock_qty, reserved_qty, low_stock_threshold, is_in_stock)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '99999999-9999-9999-9999-999999999901', '33333333-3333-3333-3333-333333333333', 60, 0, 8, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '99999999-9999-9999-9999-999999999902', '33333333-3333-3333-3333-333333333333', 44, 0, 8, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '99999999-9999-9999-9999-999999999903', '33333333-3333-3333-3333-333333333333', 36, 0, 6, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '99999999-9999-9999-9999-999999999904', '33333333-3333-3333-3333-333333333333', 28, 0, 6, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '99999999-9999-9999-9999-999999999905', '33333333-3333-3333-3333-333333333333', 24, 0, 4, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '99999999-9999-9999-9999-999999999906', '33333333-3333-3333-3333-333333333333', 18, 0, 4, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '99999999-9999-9999-9999-999999999907', '33333333-3333-3333-3333-333333333333', 30, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '99999999-9999-9999-9999-999999999908', '33333333-3333-3333-3333-333333333333', 12, 0, 3, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', '99999999-9999-9999-9999-999999999909', '33333333-3333-3333-3333-333333333333', 40, 0, 6, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa10', '99999999-9999-9999-9999-999999999910', '33333333-3333-3333-3333-333333333333', 26, 0, 6, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa11', '99999999-9999-9999-9999-999999999911', '33333333-3333-3333-3333-333333333333', 20, 0, 4, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa12', '99999999-9999-9999-9999-999999999912', '33333333-3333-3333-3333-333333333333', 14, 0, 3, TRUE)
ON CONFLICT (id) DO UPDATE SET variant_id = EXCLUDED.variant_id, store_id = EXCLUDED.store_id, stock_qty = EXCLUDED.stock_qty, reserved_qty = EXCLUDED.reserved_qty, low_stock_threshold = EXCLUDED.low_stock_threshold, is_in_stock = EXCLUDED.is_in_stock;

UPDATE carts SET coupon_code = NULL, updated_at = NOW() WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1';

INSERT INTO coupons (id, code, type, value, min_order_value, max_discount, usage_limit, per_user_limit, is_active)
VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'WELCOME100', 'flat', 100, 499, 100, 10000, 1, TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'FRESH20', 'percentage', 20, 699, 200, 5000, 3, TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'FREEDEL', 'flat', 39, 299, 39, 5000, 5, TRUE)
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, type = EXCLUDED.type, value = EXCLUDED.value, min_order_value = EXCLUDED.min_order_value, max_discount = EXCLUDED.max_discount, usage_limit = EXCLUDED.usage_limit, per_user_limit = EXCLUDED.per_user_limit, is_active = EXCLUDED.is_active;

UPDATE carts SET coupon_code = 'WELCOME100', updated_at = NOW() WHERE id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1';

INSERT INTO cart_items (id, cart_id, variant_id, quantity, unit_price)
VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999905', 1, 289),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999907', 1, 165),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999910', 1, 68)
ON CONFLICT (id) DO UPDATE SET cart_id = EXCLUDED.cart_id, variant_id = EXCLUDED.variant_id, quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price;

UPDATE addresses
SET house_no = '12A', apartment_name = 'Sunrise Residency', street_area = '100 Feet Road, Indiranagar', landmark = 'Near Metro Station', formatted_address = '12A, Sunrise Residency, 100 Feet Road, Indiranagar, Near Metro Station, Bangalore, Karnataka, 560038, India', google_map_link = 'https://www.google.com/maps?q=12.9719,77.6408', updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc1';

UPDATE addresses
SET house_no = '8th Floor', apartment_name = 'Tech Park Tower B', street_area = 'Outer Ring Road, HSR Layout', landmark = 'Opposite Service Road', formatted_address = '8th Floor, Tech Park Tower B, Outer Ring Road, HSR Layout, Opposite Service Road, Bangalore, Karnataka, 560102, India', google_map_link = 'https://www.google.com/maps?q=12.9116,77.6474', updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-ccccccccccc2';

UPDATE orders
SET order_number = 'NK10001', subtotal = 522, discount_total = 100, tax_total = 73, delivery_fee = 0, grand_total = 495, delivery_contact_name = 'Demo User', delivery_mobile = '9876543210', delivery_address = '12A, Sunrise Residency, 100 Feet Road, Indiranagar, Near Metro Station, Bangalore, Karnataka, 560038, India', delivery_latitude = 12.9719, delivery_longitude = 77.6408, google_map_link = 'https://www.google.com/maps?q=12.9719,77.6408', age_confirmed = FALSE, updated_at = NOW()
WHERE id = 'ffffffff-ffff-ffff-ffff-fffffffffff1';

INSERT INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price, tax_amount, line_total)
VALUES
('12121212-1212-1212-1212-121212121211', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999905', 'Aashirvaad Whole Wheat Atta', '5 kg', 1, 289, 40, 329),
('12121212-1212-1212-1212-121212121212', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999907', 'Fortune Sunlite Sunflower Oil', '1 L', 1, 165, 23, 188),
('12121212-1212-1212-1212-121212121213', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999910', 'Daily Fresh Toned Milk', '1 L', 1, 68, 10, 78)
ON CONFLICT (id) DO UPDATE SET order_id = EXCLUDED.order_id, variant_id = EXCLUDED.variant_id, product_name = EXCLUDED.product_name, variant_name = EXCLUDED.variant_name, quantity = EXCLUDED.quantity, unit_price = EXCLUDED.unit_price, tax_amount = EXCLUDED.tax_amount, line_total = EXCLUDED.line_total;

UPDATE payments SET amount = 495, paid_at = NOW() WHERE id = '13131313-1313-1313-1313-131313131313';

COMMIT;
