export const BRANDS = {
  vehicle: ['VinFast', 'Tesla', 'Hyundai', 'BYD', 'Audi', 'BMW', 'Mercedes', 'Nissan', 'Kia'],
  battery: ['CATL', 'LG Energy', 'BYD', 'Samsung SDI', 'Panasonic', 'SK Innovation'],
};

export const CONDITIONS = [
  { value: 'excellent', label: 'Xuất sắc' },
  { value: 'good', label: 'Tốt' },
  { value: 'fair', label: 'Khá' },
  { value: 'poor', label: 'Trung bình' },
];

export const PRODUCT_TYPES = [
  { value: 'vehicle', label: 'Xe điện' },
  { value: 'battery', label: 'Pin xe điện' },
];

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Chuyển khoản ngân hàng' },
  { value: 'credit_card', label: 'Thẻ tín dụng' },
  { value: 'e_wallet', label: 'Ví điện tử' },
  { value: 'cash', label: 'Tiền mặt' },
];

export const TRANSACTION_STATUS = {
  pending: 'Chờ xử lý',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const LISTING_STATUS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  sold: 'Đã bán',
};

export const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

export const BATTERY_CAPACITIES = [40, 50, 60, 70, 80, 90, 100];

export const PRICE_RANGES = [
  { min: 0, max: 500000000, label: 'Dưới 500 triệu' },
  { min: 500000000, max: 1000000000, label: '500 triệu - 1 tỷ' },
  { min: 1000000000, max: 1500000000, label: '1 tỷ - 1.5 tỷ' },
  { min: 1500000000, max: 2000000000, label: '1.5 tỷ - 2 tỷ' },
  { min: 2000000000, max: null, label: 'Trên 2 tỷ' },
];
