import { supabase } from './supabaseClient';
import type { Order, CartItem, ShippingAddress } from '../types/order';

const mapOrder = (row: any): Order => {
  return {
    id: String(row.id),
    orderType: row.order_type || 'sale',
    items: Array.isArray(row.items) ? row.items : [],
    shippingAddress: typeof row.shipping_address === 'object' ? row.shipping_address : {},
    subtotal: Number(row.subtotal || 0),
    shippingFee: Number(row.shipping_fee || 150),
    tax: Number(row.tax || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total_amount || row.total || 0),
    status: row.status || 'placed',
    createdAt: row.created_at,
    estimatedDelivery: row.estimated_delivery || '3-5 Business Days',
    awb_code: row.awb_code,
    courier_name: row.courier_name,
    shiprocket_order_id: row.shiprocket_order_id,
  };
};

export const orderApi = {
  createOrder: async (
    items: CartItem[], 
    shippingAddress: ShippingAddress, 
    subtotal: number, 
    tax: number, 
    total: number, 
    paymentMethod: string = 'online'
  ): Promise<Order> => {
    const { data: userData } = await supabase.auth.getUser();
    const clientId = userData?.user?.id;
    if (!clientId) throw new Error('Not authenticated');

    // Ensure the user exists in public 'users' table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', clientId)
      .maybeSingle();

    if (!existingUser) {
      await supabase.from('users').insert([{
        id: clientId,
        name: userData.user?.user_metadata?.name || shippingAddress.fullName || 'Customer',
        phone: userData.user?.phone || userData.user?.user_metadata?.phone || shippingAddress.phone || '0000000000',
        email: userData.user?.email || '',
        role: 'customer'
      }]);
    }

    const newOrderRow = {
      user_id: clientId,
      order_type: 'sale',
      total_amount: total,
      status: 'pending',
      fulfillment_mode: 'courier',
      items,
      shipping_address: shippingAddress,
      subtotal,
      tax,
      shipping_fee: 150,
      discount: subtotal + tax + 150 - total > 0 ? subtotal + tax + 150 - total : 0,
      payment_method: paymentMethod
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrderRow])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    
    return mapOrder(data);
  },

  createRentalOrder: async (
    items: CartItem[], 
    subtotal: number, 
    tax: number, 
    total: number, 
    shippingAddress?: ShippingAddress, 
    paymentMethod: string = 'online'
  ): Promise<Order> => {
    const { data: userData } = await supabase.auth.getUser();
    const customerId = userData?.user?.id;
    if (!customerId) throw new Error('Not authenticated');

    // Ensure the user exists in public 'users' table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', customerId)
      .maybeSingle();

    if (!existingUser) {
      await supabase.from('users').insert([{
        id: customerId,
        name: userData.user?.user_metadata?.name || shippingAddress?.fullName || 'Customer',
        phone: userData.user?.phone || userData.user?.user_metadata?.phone || shippingAddress?.phone || '0000000000',
        email: userData.user?.email || '',
        role: 'customer'
      }]);
    }

    const newOrderRow = {
      user_id: customerId,
      order_type: 'rental',
      total_amount: total,
      status: 'confirmed',
      fulfillment_mode: 'courier',
      items,
      shipping_address: shippingAddress || {},
      subtotal,
      tax,
      shipping_fee: 0,
      discount: 0,
      payment_method: paymentMethod
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([newOrderRow])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    
    return mapOrder(data);
  },

  getOrders: async (): Promise<Order[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching orders:', error);
      return [];
    }

    return (data || []).map(mapOrder);
  },
};
