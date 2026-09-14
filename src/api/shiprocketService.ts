/**
 * Mock Shiprocket Service
 * This service simulates the Shiprocket API for generating shipments and tracking.
 * When real credentials are provided, replace these mock functions with actual axios/fetch calls to https://apiv2.shiprocket.in
 */

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: string;
  }>;
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

export interface ShiprocketResponse {
  order_id: string;
  shipment_id: string;
  awb_code: string;
  courier_company_id: string;
  courier_name: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createShiprocketOrder = async (_payload: ShiprocketOrderPayload): Promise<ShiprocketResponse> => {
  // Simulate API delay
  await sleep(1500);

  // Generate mock Shiprocket data
  const mockShiprocketOrderId = `SR-${Math.floor(Math.random() * 10000000)}`;
  const mockShipmentId = `SHP-${Math.floor(Math.random() * 10000000)}`;
  const mockAwbCode = `AWB${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const couriers = ['Delhivery Surface', 'BlueDart Express', 'XpressBees', 'Ecom Express'];
  const selectedCourier = couriers[Math.floor(Math.random() * couriers.length)];

  return {
    order_id: mockShiprocketOrderId,
    shipment_id: mockShipmentId,
    awb_code: mockAwbCode,
    courier_company_id: '1', // Mock ID
    courier_name: selectedCourier,
  };
};
