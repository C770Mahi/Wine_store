INSERT INTO users (id, name, email, mobile, password_hash, role, is_mobile_verified, is_email_verified, dob, age_verified_at, kyc_status, kyc_submitted_at, kyc_reviewed_at, status)
VALUES
('11111111-1111-1111-1111-111111111111', 'Demo User', 'demo@nearkart.in', '9876543210', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', TRUE, TRUE, '1992-08-12', NOW(), 'approved', NOW(), NOW(), 'active'),
('11111111-1111-1111-1111-111111111112', 'Pending KYC User', 'pending@nearkart.in', '9000000012', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', TRUE, TRUE, '1998-04-28', NULL, 'pending', NOW(), NULL, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO kyc_submissions (id, user_id, full_name, date_of_birth, document_type, document_number, front_image_url, back_image_url, selfie_image_url, status, rejection_reason, reviewed_at)
VALUES
('10101010-1010-1010-1010-101010101010', '11111111-1111-1111-1111-111111111111', 'Demo User', '1992-08-12', 'passport', 'P1234567', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80', NULL, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80', 'approved', NULL, NOW()),
('10101010-1010-1010-1010-101010101011', '11111111-1111-1111-1111-111111111112', 'Pending KYC User', '1998-04-28', 'aadhaar', '999988887777', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_partners (id, name, mobile, email, vehicle_type, license_number, is_active)
VALUES ('22222222-2222-2222-2222-222222222222', 'Arjun Rider', '9000000001', 'partner@nearkart.in', 'Bike', 'DL-NEARKART-001', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stores (id, name, license_number, city, state, pincode, latitude, longitude, opening_time, closing_time, is_active)
VALUES ('33333333-3333-3333-3333-333333333333', 'Near Kart Residency Road Hub', 'LIC-BLR-0001', 'Bangalore', 'Karnataka', '560025', 12.9716, 77.5946, '07:00', '23:00', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO regions (id, state, city, pincode, is_serviceable, legal_age, cod_allowed, delivery_start_time, delivery_end_time, dry_day_block)
VALUES
('44444444-4444-4444-4444-444444444401', 'Karnataka', 'Bangalore', '560038', TRUE, 18, TRUE, '07:00', '23:00', FALSE),
('44444444-4444-4444-4444-444444444402', 'Karnataka', 'Bangalore', '560034', TRUE, 18, TRUE, '07:00', '23:00', FALSE),
('44444444-4444-4444-4444-444444444403', 'Karnataka', 'Bangalore', '560102', TRUE, 18, TRUE, '07:00', '23:00', FALSE)
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, name, slug, country, is_active)
VALUES
('66666666-6666-6666-6666-666666666601', 'Fresh Fields', 'fresh-fields', 'India', TRUE),
('66666666-6666-6666-6666-666666666602', 'Farm Basket', 'farm-basket', 'India', TRUE),
('66666666-6666-6666-6666-666666666603', 'Aashirvaad', 'aashirvaad', 'India', TRUE),
('66666666-6666-6666-6666-666666666604', 'Fortune', 'fortune', 'India', TRUE),
('66666666-6666-6666-6666-666666666605', 'Daily Fresh', 'daily-fresh', 'India', TRUE),
('66666666-6666-6666-6666-666666666606', 'Vim', 'vim', 'India', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, brand_id, category_id, name, slug, short_description, long_description, rating_avg, rating_count, is_active)
VALUES
('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'Country Tomato', 'country-tomato', 'Fresh red tomatoes ideal for curries, salads, and daily cooking.', 'Farm-picked tomatoes with a bright colour and juicy texture, suitable for everyday kitchen prep.', 4.7, 128, TRUE),
('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502', 'Banana Robusta', 'banana-robusta', 'Naturally sweet bananas packed for everyday snacking.', 'Popular table bananas selected for quick breakfast baskets, smoothies, and lunchbox fruit portions.', 4.6, 234, TRUE),
('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555505', 'Aashirvaad Whole Wheat Atta', 'aashirvaad-whole-wheat-atta', 'Trusted atta for soft rotis and daily family cooking.', 'A pantry staple with consistent quality, suited for chapatis, parathas, and routine monthly grocery baskets.', 4.8, 190, TRUE),
('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504', 'Fortune Sunlite Sunflower Oil', 'fortune-sunlite-sunflower-oil', 'Light cooking oil for everyday frying and sauteing.', 'A common kitchen essential for home cooks who want a versatile edible oil for frequent meal prep.', 4.5, 156, TRUE),
('77777777-7777-7777-7777-777777777705', '66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555503', 'Daily Fresh Toned Milk', 'daily-fresh-toned-milk', 'Chilled milk packs for tea, coffee, and breakfast routines.', 'Daily-delivery milk packs designed for quick replenishment of fridge essentials and breakfast staples.', 4.4, 118, TRUE),
('77777777-7777-7777-7777-777777777706', '66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555508', 'Vim Dishwash Liquid', 'vim-dishwash-liquid', 'Grease-cutting dishwash liquid for everyday kitchen cleanup.', 'A reliable dishwashing essential for sinks, utensils, and quick post-meal cleanup in busy homes.', 4.5, 84, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
VALUES
('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '/catalog/country-tomato.jpg', 'Fresh tomatoes', 0),
('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777702', '/catalog/banana-robusta.jpg', 'Banana bunch', 0),
('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777703', '/catalog/aashirvaad-whole-wheat-atta.jpg', 'Whole wheat flour bag', 0),
('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777704', '/catalog/fortune-sunlite-sunflower-oil.jpg', 'Sunflower oil bottle', 0),
('88888888-8888-8888-8888-888888888805', '77777777-7777-7777-7777-777777777705', '/catalog/daily-fresh-toned-milk.jpg', 'Milk packets', 0),
('88888888-8888-8888-8888-888888888806', '77777777-7777-7777-7777-777777777706', '/catalog/vim-dishwash-liquid.jpg', 'Dishwash liquid bottle', 0)
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

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
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (id, code, type, value, min_order_value, max_discount, usage_limit, per_user_limit, is_active)
VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'WELCOME100', 'flat', 100, 499, 100, 10000, 1, TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'FRESH20', 'percentage', 20, 699, 200, 5000, 3, TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'FREEDEL', 'flat', 39, 299, 39, 5000, 5, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO addresses (id, user_id, label, recipient_name, mobile, address_line_1, city, state, country, pincode, latitude, longitude, is_default)
VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'Home', 'Demo User', '9876543210', '100 Feet Road, Indiranagar', 'Bangalore', 'Karnataka', 'India', '560038', 12.9719, 77.6408, TRUE),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'Office', 'Demo User', '9876543210', 'Outer Ring Road, HSR Layout', 'Bangalore', 'Karnataka', 'India', '560102', 12.9116, 77.6474, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO carts (id, user_id, status, coupon_code)
VALUES ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'active', 'WELCOME100')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cart_items (id, cart_id, variant_id, quantity, unit_price)
VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999905', 1, 289),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999907', 1, 165),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999910', 1, 68)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, user_id, store_id, address_id, order_number, status, payment_status, subtotal, discount_total, tax_total, delivery_fee, grand_total, age_confirmed, placed_at)
VALUES ('ffffffff-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'NK10001', 'assigned', 'paid', 522, 100, 73, 0, 495, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price, tax_amount, line_total)
VALUES
('12121212-1212-1212-1212-121212121211', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999905', 'Aashirvaad Whole Wheat Atta', '5 kg', 1, 289, 40, 329),
('12121212-1212-1212-1212-121212121212', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999907', 'Fortune Sunlite Sunflower Oil', '1 L', 1, 165, 23, 188),
('12121212-1212-1212-1212-121212121213', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999910', 'Daily Fresh Toned Milk', '1 L', 1, 68, 10, 78)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, order_id, provider, provider_payment_id, provider_order_id, method, status, amount, currency, paid_at)
VALUES ('13131313-1313-1313-1313-131313131313', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'razorpay', 'pay_demo_1', 'order_demo_1', 'UPI', 'paid', 495, 'INR', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_assignments (id, order_id, partner_id, status, assigned_at, picked_at)
VALUES ('14141414-1414-1414-1414-141414141414', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '22222222-2222-2222-2222-222222222222', 'picked_up', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_locations (id, assignment_id, latitude, longitude, recorded_at)
VALUES
('15151515-1515-1515-1515-151515151515', '14141414-1414-1414-1414-141414141414', 12.9745, 77.6021, NOW() - INTERVAL '8 minutes'),
('15151515-1515-1515-1515-151515151516', '14141414-1414-1414-1414-141414141414', 12.9764, 77.6089, NOW() - INTERVAL '2 minutes')
ON CONFLICT (id) DO NOTHING;
