/*
  # Tạo schema cho nền tảng giao dịch xe điện và pin

  ## Các bảng chính:
  1. **profiles** - Thông tin người dùng
  2. **listings** - Tin đăng bán xe/pin  
  3. **transactions** - Giao dịch mua bán
  4. **reviews** - Đánh giá và feedback
  5. **favorites** - Danh sách yêu thích
  6. **bids** - Đấu giá
  7. **categories** - Danh mục sản phẩm

  ## Bảo mật:
  - Kích hoạt RLS cho tất cả bảng
  - Policies phân quyền theo role (member/admin)
*/

-- Tạo enum cho các loại sản phẩm
CREATE TYPE product_type AS ENUM ('vehicle', 'battery');

-- Tạo enum cho tình trạng sản phẩm  
CREATE TYPE condition_type AS ENUM ('excellent', 'good', 'fair', 'poor');

-- Tạo enum cho trạng thái tin đăng
CREATE TYPE listing_status AS ENUM ('pending', 'approved', 'rejected', 'sold');

-- Tạo enum cho loại giao dịch
CREATE TYPE transaction_type AS ENUM ('buy_now', 'auction');

-- Tạo enum cho trạng thái giao dịch
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'cancelled');

-- Bảng profiles - Mở rộng thông tin user từ auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  address text,
  avatar_url text,
  role text DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bảng categories - Danh mục sản phẩm
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Bảng listings - Tin đăng bán
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  title text NOT NULL,
  description text,
  product_type product_type NOT NULL,
  
  -- Thông tin xe điện
  brand text,
  model text,
  year integer,
  mileage integer,
  battery_capacity integer, -- kWh
  range_km integer,
  
  -- Thông tin pin (nếu bán riêng pin)
  battery_type text,
  battery_health integer, -- phần trăm
  cycles_count integer,
  
  condition condition_type NOT NULL DEFAULT 'good',
  price decimal(12,2) NOT NULL,
  suggested_price decimal(12,2), -- AI gợi ý giá
  is_auction boolean DEFAULT false,
  auction_end_date timestamptz,
  
  images text[], -- URLs của hình ảnh
  status listing_status DEFAULT 'pending',
  views_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bảng bids - Đấu giá
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Bảng transactions - Giao dịch
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  type transaction_type NOT NULL,
  amount decimal(12,2) NOT NULL,
  commission decimal(12,2) DEFAULT 0, -- Hoa hồng platform
  
  status transaction_status DEFAULT 'pending',
  payment_method text,
  payment_id text, -- ID từ payment gateway
  
  contract_url text, -- Link hợp đồng số
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bảng reviews - Đánh giá
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  
  created_at timestamptz DEFAULT now()
);

-- Bảng favorites - Yêu thích
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, listing_id)
);

-- Kích hoạt RLS cho tất cả bảng
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY; 
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies cho profiles
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies cho categories  
CREATE POLICY "Everyone can read categories"
  ON categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies cho listings
CREATE POLICY "Everyone can read approved listings"
  ON listings FOR SELECT TO authenticated 
  USING (status = 'approved' OR seller_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create listings"
  ON listings FOR INSERT TO authenticated 
  WITH CHECK (seller_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE TO authenticated
  USING (seller_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all listings"
  ON listings FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policies cho bids
CREATE POLICY "Users can read bids for their listings"
  ON bids FOR SELECT TO authenticated
  USING (
    bidder_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR 
    listing_id IN (
      SELECT id FROM listings WHERE seller_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create bids"
  ON bids FOR INSERT TO authenticated
  WITH CHECK (bidder_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Policies cho transactions
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT TO authenticated
  USING (
    buyer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR seller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Policies cho reviews
CREATE POLICY "Everyone can read reviews"
  ON reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create reviews for their transactions"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    transaction_id IN (
      SELECT id FROM transactions 
      WHERE buyer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
         OR seller_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Policies cho favorites
CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL TO authenticated
  USING (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  ));

-- Tạo indexes cho performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_product_type ON listings(product_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_seller ON transactions(buyer_id, seller_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_listing ON favorites(user_id, listing_id);

-- Function để update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers để auto update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions  
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();