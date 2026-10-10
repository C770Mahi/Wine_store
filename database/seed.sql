INSERT INTO users (id, name, email, mobile, password_hash, role, is_mobile_verified, is_email_verified, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'Demo User', 'demo@indusreserve.in', '9876543210', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'customer', TRUE, TRUE, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_partners (id, name, mobile, email, vehicle_type, license_number, is_active)
VALUES ('22222222-2222-2222-2222-222222222222', 'Arjun Rider', '9000000001', 'partner@indusreserve.in', 'Bike', 'DL-INDUS-001', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stores (id, name, license_number, city, state, pincode, latitude, longitude, opening_time, closing_time, is_active)
VALUES ('33333333-3333-3333-3333-333333333333', 'Residency Road Store', 'LIC-BLR-0001', 'Bangalore', 'Karnataka', '560025', 12.9716, 77.5946, '10:00', '22:00', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO regions (id, state, city, pincode, is_serviceable, legal_age, cod_allowed, delivery_start_time, delivery_end_time, dry_day_block)
VALUES
('44444444-4444-4444-4444-444444444401', 'Karnataka', 'Bangalore', '560038', TRUE, 21, FALSE, '10:00', '22:00', FALSE),
('44444444-4444-4444-4444-444444444402', 'Karnataka', 'Bangalore', '560034', TRUE, 21, FALSE, '10:00', '22:00', FALSE),
('44444444-4444-4444-4444-444444444403', 'Karnataka', 'Bangalore', '560102', TRUE, 21, FALSE, '10:00', '22:00', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, slug, sort_order, is_active)
VALUES
('55555555-5555-5555-5555-555555555501', 'Beer', 'beer', 1, TRUE),
('55555555-5555-5555-5555-555555555502', 'Whisky', 'whisky', 2, TRUE),
('55555555-5555-5555-5555-555555555503', 'Vodka', 'vodka', 3, TRUE),
('55555555-5555-5555-5555-555555555504', 'Rum', 'rum', 4, TRUE),
('55555555-5555-5555-5555-555555555505', 'Wine', 'wine', 5, TRUE),
('55555555-5555-5555-5555-555555555506', 'Brandy', 'brandy', 6, TRUE),
('55555555-5555-5555-5555-555555555507', 'Gin', 'gin', 7, TRUE),
('55555555-5555-5555-5555-555555555508', 'Tequila', 'tequila', 8, TRUE),
('55555555-5555-5555-5555-555555555509', 'Mixers', 'mixers', 9, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, name, slug, country, is_active)
VALUES
('66666666-6666-6666-6666-666666666601', 'Blenders Pride', 'blenders-pride', 'India', TRUE),
('66666666-6666-6666-6666-666666666602', 'Kingfisher', 'kingfisher', 'India', TRUE),
('66666666-6666-6666-6666-666666666603', 'Old Monk', 'old-monk', 'India', TRUE),
('66666666-6666-6666-6666-666666666604', 'Smirnoff', 'smirnoff', 'India', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, brand_id, category_id, name, slug, short_description, long_description, rating_avg, rating_count, is_active)
VALUES
('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555502', 'Blenders Pride Rare Premium Whisky', 'blenders-pride-whisky', 'Fast-moving premium whisky for urban Bangalore orders.', 'A strong Bangalore party shelf favorite with premium positioning and multiple moving bottle sizes.', 4.7, 128, TRUE),
('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'Kingfisher Premium Lager', 'kingfisher-premium-beer', 'Popular beer with strong repeat order behavior in Bangalore.', 'A city staple for Bangalore gatherings, match nights, and easy add-to-cart reorders.', 4.6, 234, TRUE),
('77777777-7777-7777-7777-777777777703', '66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555504', 'Old Monk XXX Rum', 'old-monk-rum', 'Classic Bangalore rum pick in multiple bottle sizes.', 'An iconic rum with strong reorder demand and familiar citywide retail presence.', 4.8, 190, TRUE),
('77777777-7777-7777-7777-777777777704', '66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555503', 'Smirnoff Red Vodka', 'smirnoff-red-vodka', 'Common mixer-friendly vodka for quick commerce orders.', 'A broad-reach vodka choice for house parties, mixers, and easy weekend baskets.', 4.5, 156, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_images (id, product_id, image_url, alt_text, sort_order)
VALUES
('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=80', 'Blenders Pride bottle', 0),
('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777702', 'https://images.unsplash.com/photo-1516458464372-ee7eae24b460?auto=format&fit=crop&w=900&q=80', 'Kingfisher beer bottle', 0),
('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777703', 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80', 'Old Monk rum bottle', 0),
('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777704', 'https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=900&q=80', 'Smirnoff vodka bottle', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO product_variants (id, product_id, sku, volume_ml, pack_type, mrp, sale_price, tax_rate, is_active)
VALUES
('99999999-9999-9999-9999-999999999901', '77777777-7777-7777-7777-777777777701', 'BP-180', 180, 'Bottle', 590, 540, 18, TRUE),
('99999999-9999-9999-9999-999999999902', '77777777-7777-7777-7777-777777777701', 'BP-375', 375, 'Bottle', 1090, 995, 18, TRUE),
('99999999-9999-9999-9999-999999999903', '77777777-7777-7777-7777-777777777701', 'BP-750', 750, 'Bottle', 1990, 1840, 18, TRUE),
('99999999-9999-9999-9999-999999999904', '77777777-7777-7777-7777-777777777702', 'KF-330', 330, 'Bottle', 110, 99, 18, TRUE),
('99999999-9999-9999-9999-999999999905', '77777777-7777-7777-7777-777777777702', 'KF-650', 650, 'Bottle', 190, 180, 18, TRUE),
('99999999-9999-9999-9999-999999999906', '77777777-7777-7777-7777-777777777703', 'OM-180', 180, 'Bottle', 220, 200, 18, TRUE),
('99999999-9999-9999-9999-999999999907', '77777777-7777-7777-7777-777777777703', 'OM-750', 750, 'Bottle', 820, 760, 18, TRUE),
('99999999-9999-9999-9999-999999999908', '77777777-7777-7777-7777-777777777704', 'SM-180', 180, 'Bottle', 420, 380, 18, TRUE),
('99999999-9999-9999-9999-999999999909', '77777777-7777-7777-7777-777777777704', 'SM-750', 750, 'Bottle', 1490, 1390, 18, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventories (id, variant_id, store_id, stock_qty, reserved_qty, low_stock_threshold, is_in_stock)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '99999999-9999-9999-9999-999999999901', '33333333-3333-3333-3333-333333333333', 40, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '99999999-9999-9999-9999-999999999902', '33333333-3333-3333-3333-333333333333', 24, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '99999999-9999-9999-9999-999999999903', '33333333-3333-3333-3333-333333333333', 18, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '99999999-9999-9999-9999-999999999904', '33333333-3333-3333-3333-333333333333', 60, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '99999999-9999-9999-9999-999999999905', '33333333-3333-3333-3333-333333333333', 42, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '99999999-9999-9999-9999-999999999906', '33333333-3333-3333-3333-333333333333', 28, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7', '99999999-9999-9999-9999-999999999907', '33333333-3333-3333-3333-333333333333', 15, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8', '99999999-9999-9999-9999-999999999908', '33333333-3333-3333-3333-333333333333', 22, 0, 5, TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', '99999999-9999-9999-9999-999999999909', '33333333-3333-3333-3333-333333333333', 16, 0, 5, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (id, code, type, value, min_order_value, max_discount, usage_limit, per_user_limit, is_active)
VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'WELCOME150', 'flat', 150, 999, 150, 10000, 1, TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'PARTYNIGHT', 'percentage', 10, 1500, 250, 5000, 3, TRUE),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'FREEDEL', 'flat', 49, 299, 49, 5000, 5, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO addresses (id, user_id, label, recipient_name, mobile, address_line_1, city, state, country, pincode, latitude, longitude, is_default)
VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'Home', 'Demo User', '9876543210', '100 Feet Road, Indiranagar', 'Bangalore', 'Karnataka', 'India', '560038', 12.9719, 77.6408, TRUE),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'Office', 'Demo User', '9876543210', 'Outer Ring Road, HSR Layout', 'Bangalore', 'Karnataka', 'India', '560102', 12.9116, 77.6474, FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO carts (id, user_id, status, coupon_code)
VALUES ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'active', 'WELCOME150')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cart_items (id, cart_id, variant_id, quantity, unit_price)
VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999903', 1, 1840),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', '99999999-9999-9999-9999-999999999905', 2, 180)
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, user_id, store_id, address_id, order_number, status, payment_status, subtotal, discount_total, tax_total, delivery_fee, grand_total, age_confirmed, placed_at)
VALUES ('ffffffff-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-ccccccccccc1', 'IR10001', 'assigned', 'paid', 2200, 150, 308, 0, 2358, TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, variant_id, product_name, variant_name, quantity, unit_price, tax_amount, line_total)
VALUES
('12121212-1212-1212-1212-121212121211', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999903', 'Blenders Pride Rare Premium Whisky', '750 ml', 1, 1840, 258, 2098),
('12121212-1212-1212-1212-121212121212', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999905', 'Kingfisher Premium Lager', '650 ml', 2, 180, 50, 410)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payments (id, order_id, provider, provider_payment_id, provider_order_id, method, status, amount, currency, paid_at)
VALUES ('13131313-1313-1313-1313-131313131313', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'razorpay', 'pay_demo_1', 'order_demo_1', 'UPI', 'paid', 2358, 'INR', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_assignments (id, order_id, partner_id, status, assigned_at, picked_at)
VALUES ('14141414-1414-1414-1414-141414141414', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '22222222-2222-2222-2222-222222222222', 'picked_up', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_locations (id, assignment_id, latitude, longitude, recorded_at)
VALUES
('15151515-1515-1515-1515-151515151515', '14141414-1414-1414-1414-141414141414', 12.9745, 77.6021, NOW() - INTERVAL '8 minutes'),
('15151515-1515-1515-1515-151515151516', '14141414-1414-1414-1414-141414141414', 12.9764, 77.6089, NOW() - INTERVAL '2 minutes')
ON CONFLICT (id) DO NOTHING;
