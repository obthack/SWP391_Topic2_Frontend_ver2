/*
  # Chèn dữ liệu mẫu để test

  ## Dữ liệu bao gồm:
  - Categories (danh mục)
  - Sample admin và member profiles
  - Listings mẫu (xe và pin)
  - Transactions mẫu
  - Reviews mẫu
*/

-- Chèn categories
INSERT INTO categories (id, name, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Tesla', 'Xe điện Tesla các dòng'),
  ('550e8400-e29b-41d4-a716-446655440002', 'VinFast', 'Xe điện VinFast Việt Nam'),
  ('550e8400-e29b-41d4-a716-446655440003', 'BMW', 'Xe điện BMW i-series'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Pin Lithium', 'Pin lithium các loại'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Pin LFP', 'Pin Lithium Iron Phosphate');

-- Chèn sample profiles (sẽ được tạo khi user đăng ký)
-- Lưu ý: Trong thực tế, profiles sẽ được tạo tự động khi user sign up

-- Chèn listings mẫu cho xe điện
INSERT INTO listings (
  id, seller_id, category_id, title, description, product_type,
  brand, model, year, mileage, battery_capacity, range_km,
  condition, price, suggested_price, status, images
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655441001',
    null, -- Sẽ được update sau khi có user
    '550e8400-e29b-41d4-a716-446655440001',
    'Tesla Model 3 Standard Range Plus 2021',
    'Tesla Model 3 đời 2021, màu trắng, nội thất đen. Xe đi ít, bảo dưỡng định kỳ tại Tesla Service Center. Pin còn 95% dung lượng.',
    'vehicle',
    'Tesla', 'Model 3', 2021, 25000, 55, 350,
    'excellent', 1250000000, 1200000000, 'approved',
    ARRAY['https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg', 'https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg']
  ),
  (
    '550e8400-e29b-41d4-a716-446655441002', 
    null,
    '550e8400-e29b-41d4-a716-446655440002',
    'VinFast VF8 City Edition 2023',
    'VinFast VF8 mới đăng ký 2023, màu xanh dương, full option. Xe gia đình sử dụng, còn bảo hành chính hãng.',
    'vehicle',
    'VinFast', 'VF8', 2023, 15000, 87, 420,
    'excellent', 1450000000, 1400000000, 'approved',
    ARRAY['https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg']
  ),
  (
    '550e8400-e29b-41d4-a716-446655441003',
    null,
    '550e8400-e29b-41d4-a716-446655440003', 
    'BMW iX3 M Sport 2022',
    'BMW iX3 M Sport 2022, màu đen, nội thất da nâu. Xe đẹp như mới, có history bảo dưỡng đầy đủ.',
    'vehicle',
    'BMW', 'iX3', 2022, 18000, 74, 380,
    'good', 1850000000, 1800000000, 'approved',
    ARRAY['https://images.pexels.com/photos/3354648/pexels-photo-3354648.jpeg']
  ),
  (
    '550e8400-e29b-41d4-a716-446655441004',
    null,
    '550e8400-e29b-41d4-a716-446655440001',
    'Tesla Model Y Long Range 2022 - Đấu giá',
    'Tesla Model Y 2022, màu xám, 7 chỗ. Xe đi 32k km, pin còn khỏe. Autopilot Full Self Driving. Đấu giá kết thúc sau 3 ngày.',
    'vehicle', 
    'Tesla', 'Model Y', 2022, 32000, 75, 450,
    'good', 1600000000, 1650000000, 'approved',
    ARRAY['https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg']
  );

-- Chèn listings mẫu cho pin
INSERT INTO listings (
  id, seller_id, category_id, title, description, product_type,
  battery_type, battery_health, cycles_count, battery_capacity,
  condition, price, suggested_price, status, images
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655441005',
    null,
    '550e8400-e29b-41d4-a716-446655440004',
    'Pin Lithium 60kWh cho Tesla Model S',
    'Pin thay thế cho Tesla Model S, dung lượng 60kWh. Đã qua kiểm định, còn 88% dung lượng. Bảo hành 2 năm.',
    'battery',
    'Lithium-ion NCM', 88, 1200, 60,
    'good', 180000000, 175000000, 'approved',
    ARRAY['https://images.pexels.com/photos/159298/gears-cogs-machine-machinery-159298.jpeg']
  ),
  (
    '550e8400-e29b-41d4-a716-446655441006',
    null,
    '550e8400-e29b-41d4-a716-446655440005',
    'Pin LFP 75kWh cho VinFast VF8',
    'Pin Lithium Iron Phosphate dung lượng 75kWh, còn mới 95%. Ít cycle, thích hợp thay thế pin VF8.',
    'battery',
    'LiFePO4', 95, 450, 75,
    'excellent', 220000000, 210000000, 'approved', 
    ARRAY['https://images.pexels.com/photos/159298/gears-cogs-machine-machinery-159298.jpeg']
  );

-- Update auction listing với auction end date
UPDATE listings 
SET is_auction = true, auction_end_date = now() + interval '3 days'
WHERE id = '550e8400-e29b-41d4-a716-446655441004';