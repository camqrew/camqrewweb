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
 * Generates official Shiprocket customer tracking URL for an AWB number
 */
export const getShiprocketTrackingUrl = (awbCode: string): string => {
  if (!awbCode) return '#';
  return `https://shiprocket.co//tracking/${encodeURIComponent(awbCode.trim())}`;
};
