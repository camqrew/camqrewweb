import { useState, useEffect } from 'react';
import { Eye, RefreshCcw, X, Truck, Loader2 } from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { createShiprocketOrder } from '../api/shiprocketService';

export default function Orders() {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fulfilling, setFulfilling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      // 1. Fetch Bookings (Service Hires)
      const { data: bookingsData } = await supabase.from('bookings').select(`
        *,
        users!customer_id(name)
      `);
      
      // 2. Fetch Orders (E-commerce / Rentals) if table exists
      let ordersData: any[] | null = [];
      try {
        const { data } = await supabase.from('orders').select(`
          *,
          users!user_id(name)
        `);
        ordersData = data;
      } catch (e) {
        // Table might not exist yet
      }

      const bookings = (bookingsData || []).map(b => ({
        id: b.id,
        created_at: b.created_at,
        customerName: b.users?.name || 'Unknown',
        type: 'Service Hire',
        amount: b.total_amount,
        status: b.status,
        raw: b
      }));

      const orders = (ordersData || []).map((o: any) => ({
        id: o.id,
        created_at: o.created_at,
        customerName: o.users?.name || 'Unknown',
        type: 'E-commerce',
        amount: o.total_amount || o.subtotal || o.total,
        status: o.status,
        raw: o
      }));

      const combined = [...bookings, ...orders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrdersList(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleFulfillShiprocket = async () => {
    if (!selectedOrder) return;
    setFulfilling(true);
    try {
      const response = await createShiprocketOrder({
        order_id: selectedOrder.id,
        order_date: selectedOrder.created_at,
        pickup_location: 'Camcrew HQ',
        billing_customer_name: selectedOrder.customerName,
        billing_address: selectedOrder.raw?.shipping_address?.addressLine1 || 'Unknown',
        billing_city: selectedOrder.raw?.shipping_address?.city || 'Unknown',
        billing_pincode: selectedOrder.raw?.shipping_address?.pincode || '000000',
        billing_state: selectedOrder.raw?.shipping_address?.state || 'Unknown',
        billing_country: 'India',
        billing_email: selectedOrder.raw?.shipping_address?.email || 'test@camcrew.in',
        billing_phone: selectedOrder.raw?.shipping_address?.phone || '0000000000',
        shipping_is_billing: true,
        order_items: [],
        payment_method: selectedOrder.raw?.payment_method === 'COD' ? 'COD' : 'Prepaid',
        sub_total: selectedOrder.amount,
        length: 10,
        breadth: 10,
        height: 10,
        weight: 1
      });

      // Update in Supabase
      const { error } = await supabase.from('orders')
        .update({
          awb_code: response.awb_code,
          courier_name: response.courier_name,
          shiprocket_order_id: response.order_id,
          status: 'shipped'
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Update local state
      const updatedOrder = { ...selectedOrder, status: 'shipped', raw: { ...selectedOrder.raw, awb_code: response.awb_code, courier_name: response.courier_name } };
      setSelectedOrder(updatedOrder);
      
      setOrdersList(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));

      alert(`Order fulfilled successfully via ${response.courier_name}! AWB: ${response.awb_code}`);
    } catch (error) {
      console.error(error);
      alert('Failed to fulfill via Shiprocket.');
    } finally {
      setFulfilling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    if (['completed', 'paid', 'accepted'].includes(status)) return 'badge-success';
    if (['pending', 'processing'].includes(status)) return 'badge-warning';
    return 'badge-danger';
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading orders...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Tracking</h1>
          <p className="page-subtitle">Monitor equipment purchases, rentals, and service hires</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Order Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ordersList.map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'var(--mono)' }}>
                    {order.id.split('-')[0].toUpperCase()}...
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                  </td>
                  <td>
                    <span className="badge badge-accent">{order.type}</span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(order.amount)}</td>
                  <td>
                    <span className={`badge ${getStatusColor(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn" onClick={() => setSelectedOrder(order)}>
                        <Eye size={16} /> View
                      </button>
                      <button className="btn"><RefreshCcw size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {ordersList.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 600, padding: 32, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              className="btn" 
              style={{ position: 'absolute', top: 16, right: 16, padding: 8, borderRadius: '50%' }}
              onClick={() => setSelectedOrder(null)}
            >
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: 8, fontSize: 20 }}>Order Details</h2>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
              ID: {selectedOrder.id} • {new Date(selectedOrder.created_at).toLocaleString()}
            </div>

            <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Customer Info</h3>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{selectedOrder.customerName}</div>
                {selectedOrder.raw?.shipping_address?.phone && (
                  <div style={{ fontSize: 13, marginTop: 4 }}>📞 {selectedOrder.raw.shipping_address.phone}</div>
                )}
                {selectedOrder.raw?.shipping_address?.email && (
                  <div style={{ fontSize: 13, marginTop: 4 }}>✉️ {selectedOrder.raw.shipping_address.email}</div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Shipping / Location</h3>
                {selectedOrder.type === 'E-commerce' && selectedOrder.raw?.shipping_address ? (
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                    <div>{selectedOrder.raw.shipping_address.addressLine1}</div>
                    <div>{selectedOrder.raw.shipping_address.city}, {selectedOrder.raw.shipping_address.state}</div>
                    <div style={{ fontWeight: 600 }}>{selectedOrder.raw.shipping_address.pincode}</div>
                  </div>
                ) : selectedOrder.type === 'Service Hire' && selectedOrder.raw?.location_details ? (
                   <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                     {selectedOrder.raw.location_details}
                   </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Not provided</div>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Order Summary</h3>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.raw?.subtotal || selectedOrder.raw?.total_amount || 0)}</span>
              </div>
              {selectedOrder.raw?.tax > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span>Tax</span>
                  <span>{formatCurrency(selectedOrder.raw.tax)}</span>
                </div>
              )}
              {selectedOrder.raw?.shipping_fee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span>Shipping Fee</span>
                  <span>{formatCurrency(selectedOrder.raw.shipping_fee)}</span>
                </div>
              )}
              {selectedOrder.raw?.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--accent)' }}>
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedOrder.raw.discount)}</span>
                </div>
              )}
              <hr style={{ borderColor: 'var(--border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                <span>Total Amount</span>
                <span>{formatCurrency(selectedOrder.amount || selectedOrder.raw?.total_amount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Payment Method</h3>
                <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  {selectedOrder.raw?.payment_method || 'ONLINE'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Current Status</h3>
                <span className={`badge ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status || 'Pending'}
                </span>
              </div>
            </div>

            {selectedOrder.type === 'E-commerce' && !selectedOrder.raw?.awb_code && (
              <div style={{ marginTop: 24, padding: 16, border: 'none', borderRadius: 8, backgroundColor: 'rgba(63, 182, 104, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Truck size={16} color="var(--accent)" />
                    Shiprocket Fulfillment
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Automate shipping label generation and pickup for this order.</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={handleFulfillShiprocket}
                  disabled={fulfilling}
                >
                  {fulfilling ? <Loader2 size={16} className="animate-spin" /> : 'Fulfill Now'}
                </button>
              </div>
            )}

            {selectedOrder.raw?.awb_code && (
              <div style={{ marginTop: 24, padding: 16, border: 'none', borderRadius: 8, backgroundColor: 'var(--bg-surface)' }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={16} />
                  Shipping Details
                </h3>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Courier Partner</div>
                    <div style={{ fontWeight: 600 }}>{selectedOrder.raw.courier_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>AWB Tracking Number</div>
                    <div style={{ fontWeight: 600, fontFamily: 'var(--mono)' }}>{selectedOrder.raw.awb_code}</div>
                  </div>
                </div>
              </div>
            )}

            {selectedOrder.raw?.items && selectedOrder.raw.items.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>Items Included</h3>
                <div style={{ border: 'none', borderRadius: 8, padding: 12, backgroundColor: 'var(--bg-surface)' }}>
                  {selectedOrder.raw.items.map((it: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx !== selectedOrder.raw.items.length - 1 ? 12 : 0, paddingBottom: idx !== selectedOrder.raw.items.length - 1 ? 12 : 0, borderBottom: idx !== selectedOrder.raw.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 14 }}>
                        <div style={{ fontWeight: 600 }}>{it.product?.name || 'Item'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Qty: {it.quantity || 1}</div>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {formatCurrency((it.product?.price || 0) * (it.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
