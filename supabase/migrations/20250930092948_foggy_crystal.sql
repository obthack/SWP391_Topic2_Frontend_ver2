/*
  # Chèn dữ liệu mẫu cho testing

  1. Categories - Danh mục sản phẩm
  2. Sample profiles - Tài khoản test
  3. Sample listings - Tin đăng mẫu
  4. Sample transactions - Giao dịch mẫu
  5. Sample reviews - Đánh giá mẫu
*/

-- Chèn categories
INSERT INTO categories (name, description) VALUES
('Tesla', 'Xe điện và phụ kiện Tesla'),
('VinFast', 'Xe điện VinFast và phụ kiện'),
('BYD', 'Xe điện BYD và pin lithium'),
('Hyundai', 'Xe điện Hyundai và phụ kiện'),
('BMW', 'Xe điện BMW và pin cao cấp'),
('Pin Lithium', 'Pin lithium ion các loại'),
('Pin LFP', 'Pin Lithium Iron Phosphate'),
('Phụ kiện', 'Phụ kiện xe điện và sạc');

-- Chèn sample listings cho xe điện
INSERT INTO listings (
  seller_id, category_id, title, description, product_type,
  brand, model, year, mileage, battery_capacity, range_km,
  condition, price, suggested_price, is_auction, images, status
) VALUES
-- Tesla Model 3
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
 (SELECT id FROM categories WHERE name = 'Tesla' LIMIT 1),
 'Tesla Model 3 Standard Range Plus 2021',
 'Tesla Model 3 đời 2021, màu trắng, nội thất đen. Xe đi 45,000km, pin còn 92% dung lượng. Bảo hành còn 2 năm. Xe không tai nạn, ngập nước.',
 'vehicle',
 'Tesla', 'Model 3', 2021, 45000, 54, 350,
 'good', 850000000, 820000000, false,
 ARRAY['https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg', 'https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg'],
 'approved'),

-- VinFast VF8
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 1),
 (SELECT id FROM categories WHERE name = 'VinFast' LIMIT 1),
 'VinFast VF8 City Edition 2023',
 'VinFast VF8 mới 99%, đi 8,000km. Pin thuê bao, xe còn bảo hành chính hãng 5 năm. Đầy đủ phụ kiện, sách sổ.',
 'vehicle',
 'VinFast', 'VF8', 2023, 8000, 87, 420,
 'excellent', 1250000000, 1200000000, true,
 ARRAY['https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg', 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'],
 'approved'),

-- BYD Tang
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 2),
 (SELECT id FROM categories WHERE name = 'BYD' LIMIT 1),
 'BYD Tang EV 2022 - 7 chỗ',
 'BYD Tang 7 chỗ, pin Blade Battery an toàn. Xe gia đình sử dụng kỹ, đi 32,000km. Nội thất còn mới, có camera 360.',
 'vehicle',
 'BYD', 'Tang', 2022, 32000, 86, 400,
 'good', 980000000, 950000000, false,
 ARRAY['https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg'],
 'approved');

-- Chèn sample listings cho pin
INSERT INTO listings (
  seller_id, category_id, title, description, product_type,
  battery_type, battery_health, cycles_count, battery_capacity,
  condition, price, suggested_price, is_auction, images, status
) VALUES
-- Pin Tesla
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
 (SELECT id FROM categories WHERE name = 'Pin Lithium' LIMIT 1),
 'Pin Tesla Model S 85kWh - Còn 88% dung lượng',
 'Pin Tesla Model S 85kWh, đã qua sử dụng 6 năm. Dung lượng còn 88%, khoảng 1200 cycles. Phù hợp làm pin dự phòng hoặc thay thế.',
 'battery',
 'Lithium NCA', 88, 1200, 85,
 'good', 180000000, 170000000, false,
 ARRAY['https://images.pexels.com/photos/159201/tesla-electric-car-model-s-159201.jpeg'],
 'approved'),

-- Pin LFP
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 1),
 (SELECT id FROM categories WHERE name = 'Pin LFP' LIMIT 1),
 'Pin LFP 100kWh - BYD Blade Battery',
 'Pin LFP BYD Blade Battery 100kWh, mới 95%. Chỉ 800 cycles, tuổi thọ cao. Có thể dùng cho xe điện hoặc lưu trữ năng lượng.',
 'battery',
 'LiFePO4', 95, 800, 100,
 'excellent', 220000000, 210000000, true,
 ARRAY['https://images.pexels.com/photos/159201/tesla-electric-car-model-s-159201.jpeg'],
 'approved');

-- Chèn sample bids cho auction listings
INSERT INTO bids (listing_id, bidder_id, amount) VALUES
((SELECT id FROM listings WHERE is_auction = true LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
 1180000000),
((SELECT id FROM listings WHERE is_auction = true LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 1),
 1200000000),
((SELECT id FROM listings WHERE is_auction = true LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 2),
 1220000000);

-- Chèn sample transactions
INSERT INTO transactions (
  listing_id, buyer_id, seller_id, type, amount, commission, status, payment_method
) VALUES
((SELECT id FROM listings WHERE is_auction = false LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 1),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
 'buy_now', 850000000, 25500000, 'completed', 'banking'),

((SELECT id FROM listings WHERE product_type = 'battery' LIMIT 1),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 2),
 (SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
 'buy_now', 180000000, 5400000, 'completed', 'e-wallet');

-- Chèn sample reviews
INSERT INTO reviews (transaction_id, reviewer_id, reviewed_id, rating, comment) VALUES
((SELECT id FROM transactions LIMIT 1),
 (SELECT buyer_id FROM transactions LIMIT 1),
 (SELECT seller_id FROM transactions LIMIT 1),
 5, 'Xe đúng mô tả, người bán nhiệt tình. Giao dịch nhanh chóng, uy tín!'),

((SELECT id FROM transactions LIMIT 1 OFFSET 1),
 (SELECT buyer_id FROM transactions LIMIT 1 OFFSET 1),
 (SELECT seller_id FROM transactions LIMIT 1 OFFSET 1),
 4, 'Pin chất lượng tốt, đóng gói cẩn thận. Giá hợp lý.');

-- Chèn sample favorites
INSERT INTO favorites (user_id, listing_id) VALUES
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
 (SELECT id FROM listings WHERE product_type = 'vehicle' LIMIT 1 OFFSET 1)),
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 1),
 (SELECT id FROM listings WHERE product_type = 'battery' LIMIT 1)),
((SELECT id FROM profiles WHERE role = 'member' LIMIT 1 OFFSET 2),
 (SELECT id FROM listings WHERE product_type = 'vehicle' LIMIT 1));