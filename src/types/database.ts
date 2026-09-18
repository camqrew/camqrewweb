// -------------------------------------------------------------
// CAMQREW STUDIO: Phase 1 Database Overhaul Types (31 Tables)
// -------------------------------------------------------------

// 1. Authentication & User Management
export interface DBUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'professional' | 'admin';
  avatar?: string;
  gstin?: string;
  created_at: string;
}

export interface DBPasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  is_used: boolean;
  expires_at: string;
  created_at: string;
}

export interface DBAddress {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
}

export interface DBPaymentMethod {
  id: string;
  user_id: string;
  provider: 'razorpay' | 'stripe';
  card_last4?: string;
  card_brand?: string;
  upi_id?: string;
  is_default: boolean;
  created_at: string;
}

// 2. E-Commerce & Marketplace Catalog
export interface DBProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  specifications: Record<string, any>;
  images: string[];
  in_stock: boolean;
  stock_quantity: number;
  created_at: string;
}

export interface DBCartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

export interface DBOrder {
  id: string;
  user_id: string;
  total_amount: number;
  fulfillment_mode: string;
  address_id?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  tracking_number?: string;
  courier_partner?: string;
  created_at: string;
}

export interface DBProSaleItem {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  description?: string;
  images: string[];
  status: string;
  created_at: string;
}

export interface DBCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from?: string;
  valid_until?: string;
  usage_limit?: number;
  used_count: number;
  created_at: string;
}

export interface DBReward {
  id: string;
  user_id: string;
  points: number;
  referral_balance: number;
  created_at: string;
}

export interface DBRefund {
  id: string;
  order_id: string;
  transaction_id: string;
  amount: number;
  status: 'processing' | 'completed' | 'failed';
  reason?: string;
  created_at: string;
}

// 3. Creative Services & Studio Bookings
export interface DBProfessionalProfile {
  id: string;
  title: string;
  bio?: string;
  experience_years: number;
  rate_per_day: number;
  state?: string;
  city?: string;
  categories: string[];
  skills: string[];
  equipment: string[];
  rating: number;
  review_count: number;
  verified: boolean;
  created_at: string;
}

export interface DBPortfolioItem {
  id: string;
  professional_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  title?: string;
  description?: string;
  created_at: string;
}

export interface DBStudioBay {
  id: string;
  owner_id: string;
  name: string;
  dimensions?: string;
  hourly_rate: number;
  description?: string;
  images: string[];
  amenities: string[];
  created_at: string;
}

export interface DBBooking {
  id: string;
  customer_id: string;
  professional_id: string;
  studio_id?: string;
  start_datetime: string;
  end_datetime: string;
  total_amount: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
}

export interface DBProfessionalRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  budget?: number;
  required_skills: string[];
  location?: string;
  status: 'open' | 'closed';
  created_at: string;
}

export interface DBProfessionalJob {
  id: string;
  request_id: string;
  professional_id: string;
  status: 'matched' | 'in-progress' | 'completed';
  created_at: string;
}

export interface DBProBlockedDate {
  id: string;
  professional_id: string;
  date: string;
  reason?: string;
  created_at: string;
}

export interface DBVerificationRequest {
  id: string;
  professional_id: string;
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

// 4. Equipment Rentals
export interface DBRentalEquipment {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  daily_rate: number;
  security_deposit: number;
  description?: string;
  images: string[];
  status: string;
  created_at: string;
}

export interface DBRentalOrder {
  id: string;
  customer_id: string;
  equipment_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  deposit_status: string;
  status: 'confirmed' | 'active' | 'returned';
  created_at: string;
}

// 5. Escrow & Financial Management
export interface DBEscrowPayment {
  id: string;
  booking_id: string;
  amount: number;
  status: 'held' | 'released' | 'refunded';
  transaction_id?: string;
  created_at: string;
}

export interface DBBookingMilestone {
  id: string;
  booking_id: string;
  title: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  due_date?: string;
  created_at: string;
}

export interface DBCrewPayout {
  id: string;
  professional_id: string;
  amount: number;
  status: 'processing' | 'paid' | 'failed';
  reference_id?: string;
  created_at: string;
}

// 6. Media Vault, Messaging & Social
export interface DBVaultFolder {
  id: string;
  owner_id: string;
  booking_id?: string;
  name: string;
  created_at: string;
}

export interface DBVaultFile {
  id: string;
  folder_id: string;
  uploader_id: string;
  file_name: string;
  file_url: string;
  file_size_bytes?: number;
  file_type?: string;
  created_at: string;
}

export interface DBChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

export interface DBReview {
  id: string;
  reviewer_id: string;
  target_user_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface DBNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  action_link?: string;
  is_read: boolean;
  created_at: string;
}

// 7. Support & Marketing
export interface DBNewsletterSubscriber {
  id: string;
  email: string;
  status: string;
  created_at: string;
}

export interface DBContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: string;
  created_at: string;
}
