import type { Product } from './product';

export interface CartItem {
  product: Product;
  quantity: number;
  startDate?: string;
  endDate?: string;
  daysCount?: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  state: string;
  district?: string;
  city: string;
  pincode: string;
  aadharNumber?: string;
  aadharFront?: string;
  aadharBack?: string;
}

export interface Order {
  id: string;
  orderType: 'sale' | 'rental';
  items: CartItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery: string;
  awb_code?: string;
  courier_name?: string;
  shiprocket_order_id?: string;
}
