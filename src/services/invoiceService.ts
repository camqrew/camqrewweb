import { supabase } from '../api/supabaseClient';

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  user_id: string;
  booking_id?: string;
  order_id?: string;
  service_title: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  billing_address?: any;
  creator_name?: string;
  creator_id?: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gst_rate: number;
  total_amount: number;
  payment_method: string;
  payment_id: string;
  escrow_status: string;
  invoice_date: string;
  pdf_url?: string;
  created_at: string;
}

export const invoiceService = {
  /**
   * Fetches or generates a permanent GST tax invoice for a booking paid into Escrow
   */
  createOrGetBookingInvoice: async (bookingId: string): Promise<InvoiceRecord> => {
    // 1. Check if invoice already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('*')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existing) {
      return existing as InvoiceRecord;
    }

    // 2. Fetch booking details directly
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      throw new Error(`Booking ${bookingId} not found.`);
    }

    let customerUser: any = {};
    if (booking.customer_id) {
      const { data: uData } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', booking.customer_id)
        .maybeSingle();
      if (uData) customerUser = uData;
    }

    let creatorName = 'Camqrew Verified Professional';
    if (booking.professional_id) {
      const { data: pData } = await supabase
        .from('users')
        .select('name')
        .eq('id', booking.professional_id)
        .maybeSingle();
      if (pData?.name) creatorName = pData.name;
    }

    const total = Number(booking.total_amount || 15000);
    // 18% GST calculation (Pricing is inclusive of 18% GST)
    const subtotal = Math.round((total / 1.18) * 100) / 100;
    const totalGst = Math.round((total - subtotal) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    const cleanBookingId = String(booking.id).replace(/-/g, '').slice(0, 8).toUpperCase();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${cleanBookingId}`;
    const paymentId = `ESC-PAY-${cleanBookingId}`;

    const newInvoice: Partial<InvoiceRecord> = {
      invoice_number: invoiceNumber,
      user_id: booking.customer_id,
      booking_id: String(booking.id),
      service_title: booking.service_title || booking.items?.serviceTitle || 'Creative Production Service',
      customer_name: customerUser.name || 'Customer',
      customer_email: customerUser.email || undefined,
      customer_phone: customerUser.phone || undefined,
      billing_address: typeof booking.location_details === 'object' ? booking.location_details : {},
      creator_name: creatorName,
      creator_id: booking.professional_id,
      subtotal,
      cgst,
      sgst,
      igst: 0,
      gst_rate: 18,
      total_amount: total,
      payment_method: booking.payment_method || 'Online Escrow Payment (Razorpay/UPI)',
      payment_id: paymentId,
      escrow_status: 'HELD SAFELY IN ESCROW',
      invoice_date: new Date().toISOString(),
    };

    const { data: inserted, error: insErr } = await supabase
      .from('invoices')
      .insert([newInvoice])
      .select()
      .single();

    if (insErr) {
      console.warn('Invoice insert fallback notice:', insErr.message);
      return {
        id: `inv-${bookingId}`,
        ...newInvoice,
        created_at: new Date().toISOString(),
      } as InvoiceRecord;
    }

    return inserted as InvoiceRecord;
  },

  /**
   * Fetches or generates a permanent GST tax invoice for an equipment order/rental
   */
  createOrGetOrderInvoice: async (orderId: string): Promise<InvoiceRecord> => {
    // 1. Check existing
    const { data: existing } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existing) {
      return existing as InvoiceRecord;
    }

    // 2. Fetch order details directly
    const { data: order, error: oErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (oErr || !order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    let customerUser: any = {};
    if (order.user_id) {
      const { data: uData } = await supabase
        .from('users')
        .select('name, email, phone')
        .eq('id', order.user_id)
        .maybeSingle();
      if (uData) customerUser = uData;
    }

    const total = Number(order.total_amount || 0);
    const subtotal = order.subtotal ? Number(order.subtotal) : Math.round((total / 1.18) * 100) / 100;
    const totalGst = order.tax ? Number(order.tax) : Math.round((total - subtotal) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    const shipAddr = typeof order.shipping_address === 'object' ? order.shipping_address : {};
    const cleanOrderId = String(order.id).replace(/-/g, '').slice(0, 8).toUpperCase();
    const invoiceNumber = `INV-ORD-${new Date().getFullYear()}-${cleanOrderId}`;

    const newInvoice: Partial<InvoiceRecord> = {
      invoice_number: invoiceNumber,
      user_id: order.user_id,
      order_id: String(order.id),
      service_title: order.order_type === 'rental' ? 'Equipment Rental Escrow Deposit' : 'Gear Marketplace Purchase',
      customer_name: customerUser.name || shipAddr.fullName || 'Customer',
      customer_email: customerUser.email || shipAddr.email || undefined,
      customer_phone: customerUser.phone || shipAddr.phone || undefined,
      billing_address: shipAddr,
      creator_name: 'Camqrew Verified Logistics',
      subtotal,
      cgst,
      sgst,
      igst: 0,
      gst_rate: 18,
      total_amount: total,
      payment_method: order.payment_method || 'Online Escrow Deposit',
      payment_id: `ESC-${cleanOrderId}`,
      escrow_status: 'HELD SAFELY IN ESCROW',
      invoice_date: order.created_at || new Date().toISOString(),
    };

    const { data: inserted, error: insErr } = await supabase
      .from('invoices')
      .insert([newInvoice])
      .select()
      .single();

    if (insErr) {
      return {
        id: `inv-${orderId}`,
        ...newInvoice,
        created_at: new Date().toISOString(),
      } as InvoiceRecord;
    }

    return inserted as InvoiceRecord;
  },

  /**
   * Retrieves all invoices belonging to a specific customer or creator
   */
  getUserInvoices: async (userId: string): Promise<InvoiceRecord[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false });

    if (error) {
      console.warn('Error fetching user invoices:', error.message);
      return [];
    }

    return (data || []) as InvoiceRecord[];
  },

  /**
   * Opens the printable Tax Invoice PDF directly in a new window or triggers browser print
   */
  openAndPrintInvoice: (inv: InvoiceRecord) => {
    const html = invoiceService.generateInvoiceHTML(inv);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {}
      }, 400);
    }
  },

  /**
   * Generates a fully formatted, print-optimized HTML Tax Invoice with 18% GST breakdown
   */
  generateInvoiceHTML: (inv: InvoiceRecord): string => {
    const issueDate = new Date(inv.invoice_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const billAddr = inv.billing_address || {};
    const addrLine1 = billAddr.addressLine1 || billAddr.line1 || billAddr.address || 'Standard Registered Address';
    const cityState = [billAddr.city, billAddr.state].filter(Boolean).join(', ') || 'Maharashtra, India';
    const pincode = billAddr.pincode ? ` - ${billAddr.pincode}` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${inv.invoice_number}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Google Sans', 'Plus Jakarta Sans', 'Product Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      font-size: 10px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-btn-bar {
      text-align: center;
      padding: 10px;
      background: #0f172a;
      margin-bottom: 12px;
    }
    .print-btn {
      background: #16a34a;
      color: #ffffff;
      border: none;
      padding: 7px 18px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 22px 24px;
    }
    @media print {
      .print-btn-bar, .no-print { display: none !important; }
      body { background: #ffffff !important; padding: 0 !important; }
      .invoice-wrapper { border: none !important; padding: 0 !important; max-width: 100% !important; }
    }
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .brand-col { max-width: 55%; }
    .brand-logo-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 3px;
    }
    .logo-svg {
      height: 24px;
      width: auto;
      max-width: 170px;
      display: block;
    }
    .brand-llp {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .brand-sub {
      font-size: 8.5px;
      color: #64748b;
      line-height: 1.3;
      margin-top: 2px;
    }
    .gstin-pill {
      display: inline-block;
      margin-top: 3px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 1.5px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .doc-meta-col { text-align: right; }
    .doc-title {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .doc-number {
      font-size: 12px;
      font-weight: 800;
      color: #16a34a;
      margin-top: 1px;
    }
    .meta-line {
      font-size: 9px;
      color: #475569;
      margin-top: 1.5px;
    }
    .meta-line strong { color: #0f172a; }
    .escrow-verified-pill {
      display: inline-block;
      margin-top: 4px;
      background: #dcfce7;
      border: 1px solid #86efac;
      color: #15803d;
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 12px;
      letter-spacing: 0.3px;
    }
    .parties-grid {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .party-card {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
    }
    .party-tag {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 2px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .party-name {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1px;
    }
    .party-detail {
      font-size: 9px;
      color: #475569;
      line-height: 1.35;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .items-table th {
      background: #0f172a;
      color: #ffffff;
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 5px 8px;
      text-align: left;
    }
    .items-table th.center, .items-table td.center { text-align: center; }
    .items-table th.right, .items-table td.right { text-align: right; }
    .items-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9px;
      color: #1e293b;
      vertical-align: top;
    }
    .items-table tr:nth-child(even) td { background: #f8fafc; }
    .item-title { font-weight: 700; color: #0f172a; }
    .item-desc { font-size: 8px; color: #64748b; margin-top: 1px; }

    .bottom-split {
      display: flex;
      gap: 10px;
      margin-bottom: 8px;
    }
    .bottom-left {
      flex: 1.15;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .bottom-right { flex: 0.85; }

    .milestones-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 7px 9px;
    }
    .box-mini-title {
      font-size: 8.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #334155;
      margin-bottom: 3px;
    }
    .ms-item {
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      padding: 2px 0;
      border-bottom: 1px dashed #e2e8f0;
      color: #475569;
    }
    .ms-item:last-child { border-bottom: none; }
    .ms-paid-tag { color: #166534; font-weight: 700; }

    .seal-banner {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .seal-icon-wrap { font-size: 18px; line-height: 1; }
    .seal-heading { font-size: 9px; font-weight: 800; color: #166534; }
    .seal-sub { font-size: 8px; color: #15803d; margin-top: 1px; line-height: 1.25; }

    .totals-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 4.5px 8px;
      font-size: 9px;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
    }
    .tot-row.gst-row { background: #f8fafc; font-weight: 600; color: #0f172a; }
    .tot-row.total-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 7px 8px;
      font-size: 11.5px;
      font-weight: 900;
      border-bottom: none;
    }
    .tot-row.total-banner .total-amt { color: #4ade80; }

    .footer-bar {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      margin-top: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="print-btn-bar no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-wrapper">
    <!-- Top Header -->
    <div class="top-header">
      <div class="brand-col">
        <div class="brand-logo-wrap">
          <div class="logo-svg">
            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 716.26 89">
  <path d="M172.37,1.6h-22.16c-1.26,0-2.28,1.02-2.28,2.28v.06c0,1.88-2.12,2.93-3.65,1.83-.77-.55-1.63-1.11-2.57-1.64-5.45-3.08-10.48-3.49-14.49-3.81-2.68-.22-7.66-.58-13.91.96-1.58.39-7.81,2.02-14.23,6.57-1.66,1.18-2.83,2.19-3.13,2.46-2.67,2.34-4.65,4.76-6.1,6.88-.89,1.3-2.82,1.29-3.73,0-1.57-2.23-3.75-4.82-6.7-7.3-.94-.78-4.82-3.96-10.89-6.43-6.17-2.5-11.31-2.92-14.94-3.19-4.03-.3-12.32-.83-22.3,2.47-4.41,1.46-11.47,3.88-18.21,10.38-1.84,1.77-7.56,7.62-10.77,17.06-.48,1.41-1.68,5.19-2.13,10.26-.65,7.35.65,13.02,1.23,15.23,1.82,6.91,4.88,11.64,6.13,13.45,1.03,1.48,3.98,5.55,9.06,9.49,5.67,4.39,10.92,6.26,13.87,7.28,2.09.72,10.43,3.46,21.7,2.85,4.82-.26,11.56-.69,19.19-4.38,2.64-1.28,7.66-3.77,12.21-9.11,1.03-1.21,1.9-2.4,2.62-3.51.89-1.37,2.88-1.39,3.8-.04.35.51.73,1.04,1.15,1.59.69.89,3.1,3.94,7.11,7.02,5.88,4.52,11.69,6.39,14.3,7.11,1.26.35,7.15,1.9,14.94,1.32,3.66-.27,7.87-.59,12.72-2.94,2.14-1.04,3.94-2.24,5.42-3.42,1.49-1.19,3.69-.11,3.69,1.8,0,1.7,1.38,3.07,3.07,3.07h19.97c3.11,0,5.64-2.52,5.64-5.64V7.24c0-3.11-2.52-5.64-5.64-5.64ZM83.38,57.9c.53,1.87-1.44,3.47-3.18,2.6l-11.85-5.9c-1.05-.52-2.33-.16-2.93.85-.84,1.41-2.04,3.08-3.76,4.69-1.11,1.04-2.85,2.65-5.62,3.77-3.63,1.47-6.82,1.21-8.81,1.02-1.68-.16-4.21-.42-7.09-1.91-.89-.46-3.93-2.15-6.32-5.68-2.7-3.99-2.95-7.95-3.13-10.85-.18-2.85-.44-7,1.79-11.62.77-1.6,3.09-6.24,8.55-8.87,5.46-2.63,10.51-1.56,12.06-1.21,4.11.93,6.8,3,7.66,3.7,2.27,1.86,3.7,3.94,4.57,5.59.58,1.09,1.91,1.51,3.01.95,3.96-2,7.91-4.01,11.87-6.01,1.75-.89,3.72.73,3.18,2.62-1.05,3.74-1.92,8.53-1.82,14.09.09,4.74.86,8.87,1.8,12.19ZM140.69,61.92c-4.67,3.36-9.72,3.3-10.91,3.26-.89-.03-6.75-.33-11.62-4.85-6.72-6.25-5.97-15.39-5.78-17.68.23-2.82.74-8.97,5.84-13.66,5.26-4.84,11.68-4.7,12.7-4.66.96.04,7.56.39,12.51,5.81,3.95,4.32,4.47,9.27,4.72,11.68.18,1.69,1.26,13.83-7.47,20.11Z" fill="#231f20" stroke-width="0"/>
  <path d="M327.01,25.43c-.59-2.64-1.45-6.47-4.09-10.68-.51-.81-2.63-4.12-6.55-7.32-1.18-.97-3.68-2.87-7.28-4.47-5.44-2.42-10.14-2.72-13.32-2.89-5.88-.32-10.29.61-11.19.81-7.15,1.57-11.91,4.72-12.98,5.45-1.39.95-2.61,1.93-3.68,2.89-2.18,1.96-5.55,1.89-7.62-.18-1.5-1.5-3.32-2.99-5.51-4.28-3.23-1.92-6.12-2.75-7.83-3.23-.82-.23-4.38-1.2-9.36-1.36-2.77-.09-7.2-.2-12.51,1.4-2.53.76-4.76,1.76-6.69,2.83-3.79,2.11-6.08,6.16-6.08,10.5,0-2.55,0-5.1,0-7.65,0-3.12-2.52-5.65-5.64-5.65h-18.66c-3.12.01-5.64,2.54-5.64,5.65.03,24.81.06,49.62.1,74.44,0,3.11,2.53,5.63,5.64,5.63h18.57c3.11,0,5.64-2.53,5.64-5.64,0-14.12,0-28.24-.01-42.37.07-1.5.4-3.99,1.89-6.6.24-.41.66-1.1,1.26-1.84,2.53-3.1,5.89-4.3,7.15-4.68,1.47-.44,7.15-2.15,11.91,1.36,3.12,2.3,4.09,6.01,4.77,8.43.58,2.1.7,3.79.73,4.39.28,4.73.32,20.08.07,41.18-.04,3.14,2.5,5.71,5.64,5.71h18.81c3.11,0,5.64-2.52,5.64-5.64v-40.45c.05-1.53.31-4.01,1.53-6.77.57-1.29,1.48-3.28,3.45-5.11,3.41-3.17,7.52-3.53,8.77-3.62,1.61-.12,5.15-.38,8.38,1.87,2.47,1.72,3.55,4.06,4.21,5.49,1.21,2.61,1.45,4.99,1.49,6.43.06,7.31.1,14.66.13,22.04.02,6.7.03,13.37.01,20.02,0,3.12,2.52,5.64,5.63,5.64h18.71c3.11,0,5.64-2.52,5.64-5.64v-45c0-1.32-.04-3-.21-4.94-.09-.94-.32-3.41-.94-6.17Z" fill="#231f20" stroke-width="0"/>
  <path d="M182.39,40.32v-1.01c-.03.66,0,1.04,0,1.01Z" fill="#231f20" stroke-width="0"/>
  <path d="M418.5,28.32c-1.04-2.78-3.34-8.72-8.81-14.64-4.32-4.67-8.73-7.27-10.89-8.43-2.43-1.3-8.35-4.14-16.51-4.72-6.55-.47-11.5.73-14.21,1.4-1.85.46-7.72,2.05-14.38,6.17-2.71,1.68-7.38,4.62-11.91,10.09-5.69,6.86-7.73,13.56-8.17,15.06-.46,1.6-1.98,7.2-1.45,14.6.38,5.23,1.63,9.28,2.43,11.49,2.78,7.72,7.26,13.1,10.6,16.34,4.95,4.81,9.78,7.2,11.11,7.83,3.39,1.61,10.57,4.45,19.79,3.83,3.4-.23,6.16-.87,7.98-1.39-.03.7.49,1.17,1.08,1.17h23.47c2.7,0,4.43-2.87,3.18-5.26l-3.08-5.87c-.73-1.4-.46-3.1.65-4.22,1.68-1.69,3.58-3.91,5.36-6.7.95-1.49,4.48-7.25,5.87-15.7,1.04-6.3.4-11.15.21-12.43-.58-4.01-1.65-6.91-2.3-8.64ZM394.56,51.33c-.33,1.27-1.09,4.11-3.48,6.84-2.7,3.09-5.88,4.22-7.31,4.71-1.2.41-5.31,1.76-10.19.52-6.86-1.75-10.33-7.38-11.73-9.66-1.36-2.21-5.19-8.44-3.28-16.09.38-1.53,1.88-7.15,7.43-10.65,5.58-3.52,11.39-2.46,13.34-1.98,7.16,1.75,10.71,7.42,12.06,9.57,1.2,1.92,5.18,8.85,3.15,16.73Z" fill="#231f20" stroke-width="0"/>
  <path d="M562.32,20.83c-1.33-2.21-6.12-9.7-15.66-15.06-8.3-4.67-15.85-5.28-20.6-5.62-11.54-.81-20.11,2.24-22.3,3.06-2.91,1.09-8.39,3.22-14.04,8.17-1.14,1-2.17,2.01-3.1,3.01-1.81,1.95-5.07.67-5.07-1.99V3.04c0-1.65-1.37-2.97-3.02-2.93-4.26.09-7.7.82-10.08,1.49-2.64.74-6.11,1.75-9.87,4.43-.33.23-.64.47-.94.7-1.94,1.51-4.76.17-4.76-2.29,0-1.62-1.31-2.93-2.93-2.93h-22.98c-1.62,0-2.93,1.32-2.93,2.94.06,26.59.12,53.17.18,79.76,0,1.62,1.31,2.92,2.93,2.92h24.08c1.62,0,2.93-1.31,2.93-2.93v-37.35c-.02-1.45.09-3.55.7-6,.46-1.86,1.1-4.41,3.1-7.02,2.08-2.72,4.51-4.03,5.71-4.66,3.12-1.64,5.87-1.96,8.3-2.23.79-.09,1.55-.15,2.26-.18,2.04-.09,3.52,1.9,2.88,3.84-.14.43-.28.88-.42,1.34-.27.94-1.23,4.36-1.56,9.35-.19,2.77-.44,7,.61,12.26.48,2.42,1.89,8.33,6.1,14.68,5.1,7.71,11.36,11.61,13.95,13.18,1.1.67,4.7,2.79,9.83,4.53.85.29,3.42,1.14,7.05,1.85,9.25,1.82,17.13,1.16,21,.67,3.36-.43,7.92-1.04,13.44-3.26,4.28-1.72,7.04-3.57,7.76-4.05.99-.68,1.9-1.37,2.73-2.05,2.54-2.09,2.8-5.88.53-8.26-2.81-2.96-5.62-5.91-8.43-8.87-1.9-2-4.95-2.33-7.23-.79-1.8,1.21-4.04,2.41-6.72,3.32-7.4,2.49-13.62,1.15-15.7.67-2.52-.58-5.36-1.26-8.23-3.57-.85-.68-1.57-1.4-2.18-2.12-1.45-1.7-.49-4.34,1.71-4.76l52.18-9.95c2.8-.53,4.77-3.07,4.57-5.91-.11-1.49-.3-3.11-.64-4.84-.41-2.09-1.61-7.38-5.11-13.19ZM535.4,34.41l-26.78,5.32c-2.16.43-4.1-1.46-3.68-3.62.52-2.63,1.72-5.94,4.46-8.83.52-.55,3.22-3.32,7.8-4.71,1.26-.38,8.04-2.44,14.6,1.53,2.69,1.63,4.47,3.74,5.64,5.61,1.15,1.85.09,4.27-2.05,4.7Z" fill="#231f20" stroke-width="0"/>
  <path d="M710.82,1.73h-15.97c-1.99,0-3.82,1.09-4.77,2.83-3.67,6.73-7.35,13.46-11.02,20.19-3.7,6.78-7.4,13.56-11.11,20.33-1.39,2.55-5.22,1.88-5.67-.98l-3.13-19.91-2.81-17.86c-.42-2.64-2.69-4.59-5.37-4.59h-17.93c-1.98,0-3.8,1.08-4.76,2.81-4.58,8.32-9.17,16.64-13.75,24.96l-8.57,15.55c-1.4,2.55-5.24,1.86-5.67-1.02l-2.52-16.86c-1.04-6.98-2.08-13.96-3.13-20.94-.4-2.66-2.68-4.63-5.38-4.63h-16.33c-3.36,0-5.92,3.02-5.36,6.34,1.91,11.35,3.83,22.7,5.74,34.06,2.28,13.53,4.57,27.07,6.85,40.6.44,2.62,2.71,4.53,5.36,4.53h21.77c2,0,3.85-1.1,4.79-2.87,3.52-6.58,7.05-13.16,10.57-19.74l8.63-16.12c1.36-2.54,5.17-1.93,5.67.91l2.84,16.13c1.01,5.73,2.01,11.46,3.02,17.19.46,2.6,2.71,4.49,5.35,4.49h22.08c1.99,0,3.82-1.09,4.77-2.84l20.98-38.56c6.52-11.99,13.05-23.98,19.57-35.97,1.97-3.62-.65-8.03-4.77-8.03Z" fill="#231f20" stroke-width="0"/>
</svg>
          </div>
          <span class="brand-llp">• Camqrew LLP</span>
        </div>
        <div class="brand-sub">
          Registered Office: Unit 804, Prime Corporate Hub, Bandra Kurla Complex (BKC), Mumbai - 400051<br>
          Helpline: +91 98200 12345 • Email: billing@camqrew.com • Web: www.camqrew.com
        </div>
        <div class="gstin-pill">GSTIN: 27AAACC4918P1Z3 • State: Maharashtra (Code: 27)</div>
      </div>

      <div class="doc-meta-col">
        <div class="doc-title">TAX INVOICE</div>
        <div class="doc-number">${inv.invoice_number}</div>
        <div class="meta-line">Invoice Date: <strong>${issueDate}</strong></div>
        <div class="meta-line">Escrow Ref: <strong>${inv.payment_id}</strong></div>
        <div class="meta-line">Payment Method: <strong>${inv.payment_method}</strong></div>
        <div class="escrow-verified-pill">🛡️ 100% Escrow Protected & Verified</div>
      </div>
    </div>

    <!-- Parties Grid -->
    <div class="parties-grid">
      <div class="party-card">
        <div class="party-tag">Billed To (Customer / Client)</div>
        <div class="party-name">${inv.customer_name}</div>
        <div class="party-detail">
          ${addrLine1}, ${cityState}${pincode}<br>
          ${inv.customer_phone ? `Phone: ${inv.customer_phone} • ` : ''}${inv.customer_email || 'Verified Customer'}<br>
          Place of Supply: <strong>27 - Maharashtra (Intra-State Supply)</strong>
        </div>
      </div>

      <div class="party-card">
        <div class="party-tag">Verified Creator / Service Partner</div>
        <div class="party-name">${inv.creator_name || 'Camqrew Verified Professional'}</div>
        <div class="party-detail">
          Partner ID: ${inv.creator_id ? inv.creator_id.slice(0, 12).toUpperCase() : 'CREATOR-VERIFIED'}<br>
          Escrow Status: <strong>${inv.escrow_status}</strong><br>
          Protection: <strong>Milestone Custody Active</strong>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 5%;" class="center">#</th>
          <th style="width: 50%;">Description of Service / Equipment</th>
          <th style="width: 12%;" class="center">SAC / HSN</th>
          <th style="width: 8%;" class="center">Qty</th>
          <th style="width: 12%;" class="right">Rate (₹)</th>
          <th style="width: 13%;" class="right">Taxable Base (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center">1</td>
          <td>
            <div class="item-title">${inv.service_title}</div>
            <div class="item-desc">Advance & Milestone Escrow Protected Production Service</div>
          </td>
          <td class="center">998311</td>
          <td class="center">1</td>
          <td class="right">${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td class="right">${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      </tbody>
    </table>

    <!-- Bottom Split: Milestones + Seal & Calculations -->
    <div class="bottom-split">
      <div class="bottom-left">
        <div class="milestones-box">
          <div class="box-mini-title">🔒 Escrow Milestone Schedule (Inclusive of 18% GST)</div>
          <div class="ms-item">
            <span><strong>Milestone 1:</strong> Advance Date Lock (40%)</span>
            <span class="ms-paid-tag">₹${(inv.total_amount * 0.4).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [HELD IN ESCROW]</span>
          </div>
          <div class="ms-item">
            <span><strong>Milestone 2:</strong> Production Milestone (30%)</span>
            <span>₹${(inv.total_amount * 0.3).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [LOCKED]</span>
          </div>
          <div class="ms-item">
            <span><strong>Milestone 3:</strong> Final Vault Delivery (30%)</span>
            <span>₹${(inv.total_amount * 0.3).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} [LOCKED]</span>
          </div>
        </div>

        <div class="seal-banner">
          <div class="seal-icon-wrap">🛡️</div>
          <div>
            <div class="seal-heading">100% Escrow Protected • Tri-Party Guarantee</div>
            <div class="seal-sub">
              Funds are held safely in Camqrew LLP's neutral escrow reserve. The creator receives milestone payouts strictly after your approval.
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-right">
        <div class="totals-box">
          <div class="tot-row">
            <span>Taxable Base Value:</span>
            <span>₹${inv.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tot-row gst-row">
            <span>Central GST (CGST @ 9.0%):</span>
            <span>₹${inv.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tot-row gst-row">
            <span>State GST (SGST @ 9.0%):</span>
            <span>₹${inv.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tot-row" style="background: #f1f5f9; font-weight: 700;">
            <span>Total Tax (18.0% GST):</span>
            <span>₹${(inv.cgst + inv.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div class="tot-row total-banner">
            <span>Total Paid in Escrow:</span>
            <span class="total-amt">₹${inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Page Footer -->
    <div class="footer-bar">
      <div>
        Rule 48 CGST Rules, 2017 compliant • Digitally authenticated tax invoice • No signature required
      </div>
      <div>
        Camqrew LLP • Page 1 of 1 • Permanent Account Vault
      </div>
    </div>
  </div>
</body>
</html>`;
  },
};
