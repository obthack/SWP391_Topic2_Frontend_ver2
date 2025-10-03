import { supabase } from '../lib/supabase';

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    const adminEmail = 'admin@evmarket.com';
    const adminPassword = 'admin123';
    const memberPassword = 'member123';

    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .maybeSingle();

    if (!existingAdmin) {
      console.log('Creating admin account...');
      const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
      });

      if (adminError) throw adminError;

      if (adminAuth.user) {
        await supabase.from('profiles').insert({
          id: adminAuth.user.id,
          full_name: 'Admin EV Market',
          role: 'admin',
          phone: '0901234567',
          address: 'Hà Nội, Việt Nam',
        });
        console.log('Admin account created:', adminEmail, '/', adminPassword);
      }
    }

    const memberEmails = [
      'nguyen.vana@email.com',
      'tran.thib@email.com',
      'le.vanc@email.com',
      'pham.thid@email.com',
      'hoang.vane@email.com',
    ];

    const memberNames = [
      'Nguyễn Văn A',
      'Trần Thị B',
      'Lê Văn C',
      'Phạm Thị D',
      'Hoàng Văn E',
    ];

    console.log('Creating member accounts...');
    for (let i = 0; i < memberEmails.length; i++) {
      const { data: existingMember } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', null)
        .maybeSingle();

      if (!existingMember) {
        const { data: memberAuth, error: memberError } = await supabase.auth.signUp({
          email: memberEmails[i],
          password: memberPassword,
        });

        if (!memberError && memberAuth.user) {
          await supabase.from('profiles').insert({
            id: memberAuth.user.id,
            full_name: memberNames[i],
            role: 'member',
            phone: `090${1234567 + i}`,
            address: ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng'][i],
          });
          console.log(`Member created: ${memberEmails[i]} / ${memberPassword}`);
        }
      }
    }

    const { data: categories } = await supabase.from('categories').select('id').limit(3);

    if (!categories || categories.length === 0) {
      console.log('No categories found');
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'member')
      .limit(5);

    if (!profiles || profiles.length === 0) {
      console.log('No member profiles found');
      return;
    }

    console.log('Creating sample listings...');

    const sampleListings = [
      {
        seller_id: profiles[0].id,
        category_id: categories[0].id,
        title: 'VinFast VF e34 2023 - Như mới',
        description:
          'Xe VinFast VF e34 đời 2023, màu trắng, chạy được 15.000km. Pin còn 92%. Xe đẹp như mới, full option.',
        product_type: 'vehicle',
        brand: 'VinFast',
        model: 'VF e34',
        year: 2023,
        mileage: 15000,
        battery_capacity: 42,
        range_km: 285,
        battery_health: 92,
        condition: 'excellent',
        price: 450000000,
        suggested_price: 460000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/3849168/pexels-photo-3849168.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 1234,
      },
      {
        seller_id: profiles[1].id,
        category_id: categories[0].id,
        title: 'Tesla Model 3 Long Range 2022',
        description:
          'Tesla Model 3 Long Range, màu xanh, đi 23.000km. Pin 88%, full option, autopilot. Xe đẹp, bảo dưỡng định kỳ.',
        product_type: 'vehicle',
        brand: 'Tesla',
        model: 'Model 3',
        year: 2022,
        mileage: 23000,
        battery_capacity: 75,
        range_km: 448,
        battery_health: 88,
        condition: 'good',
        price: 1200000000,
        suggested_price: 1250000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/3802508/pexels-photo-3802508.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 2156,
      },
      {
        seller_id: profiles[2].id,
        category_id: categories[0].id,
        title: 'Hyundai Kona Electric 2023 - Premium',
        description:
          'Hyundai Kona Electric cao cấp, màu đen, chạy 8.500km. Pin 95%, bảo hành chính hãng còn 3 năm.',
        product_type: 'vehicle',
        brand: 'Hyundai',
        model: 'Kona Electric',
        year: 2023,
        mileage: 8500,
        battery_capacity: 64,
        range_km: 415,
        battery_health: 95,
        condition: 'excellent',
        price: 680000000,
        suggested_price: 700000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 987,
      },
      {
        seller_id: profiles[3].id,
        category_id: categories[0].id,
        title: 'BYD Atto 3 2024 - Xe mới',
        description:
          'BYD Atto 3 mới 100%, chạy thử 3.500km. Pin 98%, full option, bảo hành chính hãng 5 năm.',
        product_type: 'vehicle',
        brand: 'BYD',
        model: 'Atto 3',
        year: 2024,
        mileage: 3500,
        battery_capacity: 60,
        range_km: 420,
        battery_health: 98,
        condition: 'excellent',
        price: 750000000,
        suggested_price: 760000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 1567,
      },
      {
        seller_id: profiles[4].id,
        category_id: categories[0].id,
        title: 'VinFast VF 8 Plus 2023',
        description: 'VinFast VF 8 Plus, màu đỏ, chạy 12.000km. Pin 90%, xe 5 chỗ rộng rãi, tiện nghi.',
        product_type: 'vehicle',
        brand: 'VinFast',
        model: 'VF 8 Plus',
        year: 2023,
        mileage: 12000,
        battery_capacity: 88,
        range_km: 420,
        battery_health: 90,
        condition: 'good',
        price: 980000000,
        suggested_price: 1000000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 1890,
      },
      {
        seller_id: profiles[0].id,
        category_id: categories[2].id,
        title: 'Pin CATL 60kWh - Chất lượng cao',
        description:
          'Pin lithium CATL 60kWh, sử dụng 200 chu kỳ, còn 95% dung lượng. Phù hợp cho xe VinFast, Tesla.',
        product_type: 'battery',
        brand: 'CATL',
        model: 'LFP 60',
        battery_capacity: 60,
        battery_type: 'LFP',
        battery_health: 95,
        cycles_count: 200,
        condition: 'excellent',
        price: 180000000,
        suggested_price: 190000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/3735747/pexels-photo-3735747.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 678,
      },
      {
        seller_id: profiles[1].id,
        category_id: categories[2].id,
        title: 'Pin LG Energy 75kWh',
        description:
          'Pin LG Energy Solution 75kWh, còn mới 98%, sử dụng 50 chu kỳ. Bảo hành 1 năm.',
        product_type: 'battery',
        brand: 'LG Energy',
        model: 'NCM 75',
        battery_capacity: 75,
        battery_type: 'NCM',
        battery_health: 98,
        cycles_count: 50,
        condition: 'excellent',
        price: 250000000,
        suggested_price: 260000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'approved',
        views_count: 543,
      },
      {
        seller_id: profiles[2].id,
        category_id: categories[0].id,
        title: 'Tesla Model Y Performance 2023',
        description:
          'Tesla Model Y Performance, màu xám, chạy 18.000km. Pin 91%, tăng tốc 3.7s, full option.',
        product_type: 'vehicle',
        brand: 'Tesla',
        model: 'Model Y',
        year: 2023,
        mileage: 18000,
        battery_capacity: 81,
        range_km: 480,
        battery_health: 91,
        condition: 'excellent',
        price: 1850000000,
        suggested_price: 1900000000,
        is_auction: false,
        images: [
          'https://images.pexels.com/photos/3136673/pexels-photo-3136673.jpeg?auto=compress&cs=tinysrgb&w=800',
        ],
        status: 'pending',
        views_count: 234,
      },
    ];

    const { error: listingsError } = await supabase.from('listings').insert(sampleListings);

    if (listingsError) {
      console.error('Error inserting listings:', listingsError);
    } else {
      console.log('Sample listings created successfully!');
    }

    console.log('\n=== DATABASE SEEDING COMPLETE ===');
    console.log('\nLogin credentials:');
    console.log(`Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`Members: ${memberEmails[0]} / ${memberPassword}`);
    console.log('(All member accounts use the same password)');

    return { success: true };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error };
  }
};
