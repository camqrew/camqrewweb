import { supabase } from './supabaseClient';

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country?: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing?: boolean;
  order_items?: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: string;
  }>;
  payment_method?: 'Prepaid' | 'COD';
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
}

export interface ShiprocketResponse {
  order_id: string;
  shipment_id: string;
  awb_code: string;
  courier_company_id?: string;
  courier_name: string;
}

export interface CreatorPickupAddress {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  pincode: string;
  pickup_nickname?: string;
}

/**
 * Creates an ad-hoc shipment and requests courier AWB assignment via Supabase Edge Function
 */
export const createShiprocketOrder = async (payload: ShiprocketOrderPayload): Promise<ShiprocketResponse> => {
  const { data, error } = await supabase.functions.invoke('shiprocket-fulfillment', {
    body: payload,
  });

  if (error) {
    console.error('Shiprocket Edge Function invocation error:', error);
    throw new Error(error.message || 'Failed to connect to Shiprocket fulfillment service.');
  }

  if (data?.error) {
    console.error('Shiprocket fulfillment error:', data.error);
    throw new Error(data.error);
  }

  return {
    order_id: String(data.order_id),
    shipment_id: String(data.shipment_id),
    awb_code: String(data.awb_code),
    courier_company_id: data.courier_company_id ? String(data.courier_company_id) : undefined,
    courier_name: String(data.courier_name || 'Shiprocket Courier'),
  };
};

/**
 * Registers or updates a creator's individual studio pickup address in Shiprocket
 */
export const registerCreatorPickupAddress = async (details: CreatorPickupAddress): Promise<{ success: boolean; pickup_location: string }> => {
  const { data, error } = await supabase.functions.invoke('shiprocket-fulfillment', {
    body: {
      action: 'register_creator_pickup',
      ...details,
    },
  });

  if (error || data?.error) {
    throw new Error(error?.message || data?.error || 'Failed to register pickup address with Shiprocket');
  }

  return data;
};

/**
 * Requests official printable courier shipping label PDF from Shiprocket
 */
export const generateShippingLabel = async (shipmentId: string | number): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('shiprocket-fulfillment', {
    body: {
      action: 'generate_label',
      shipment_id: shipmentId,
    },
  });

  if (error || data?.error) {
    throw new Error(error?.message || data?.error || 'Failed to generate shipping label PDF');
  }

  return data.label_url;
};

/**
 * Smart tracking URL helper (AWB or Order ID fallback)
 */
export const getShiprocketTrackingUrl = (awbCode?: string, shiprocketOrderId?: string): string => {
  const cleanAwb = (awbCode || '').trim();
  const cleanOrderId = (shiprocketOrderId || '').trim();

  // If a valid courier AWB number exists and is not a pending placeholder
  if (cleanAwb && !cleanAwb.toUpperCase().startsWith('PENDING')) {
    return `https://shiprocket.co//tracking/${encodeURIComponent(cleanAwb)}`;
  }

  // Fallback to Shiprocket Order ID tracking
  if (cleanOrderId && !cleanOrderId.startsWith('SR-')) {
    return `https://shiprocket.co//tracking/order/${encodeURIComponent(cleanOrderId)}`;
  }

  if (cleanAwb) {
    return `https://shiprocket.co//tracking/${encodeURIComponent(cleanAwb)}`;
  }

  return 'https://shiprocket.co//tracking';
};
