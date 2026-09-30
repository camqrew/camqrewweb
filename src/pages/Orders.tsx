import { useState, useEffect } from 'react';
import { 
  Eye, 
  RefreshCw, 
  X, 
  Truck, 
  Loader2, 
  Search, 
  Copy, 
  Check, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Package
} from 'lucide-react';
import { supabase } from '../api/supabaseClient';
import { createShiprocketOrder } from '../api/shiprocketService';

export default function Orders() {
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [fulfilling, setFulfilling] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'hire' | 'ecom'>('all');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function fetchOrders(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Bookings (Service Hires)
      const { data: bookingsData } = await supabase.from('bookings').select(`
        *,
        users!customer_id (name, email, phone)
      `).order('created_at', { ascending: false });
      
      // 2. Fetch Orders (E-commerce / Rentals) if table exists
      let ordersData: any[] | null = [];
      try {
        const { data } = await supabase.from('orders').select(`
          *,
          users!user_id (name, email, phone)
        `).order('created_at', { ascending: false });
        ordersData = data;
      } catch (e) {
        // Table might not exist yet
      }

      const bookings = (bookingsData || []).map(b => ({
        id: b.id,
        created_at: b.created_at,
        customerName: b.users?.name || 'Customer',
        customerEmail: b.users?.email,
        customerPhone: b.users?.phone,
        type: 'Service Hire',
        amount: b.total_amount || 0,
        status: b.status || 'pending',
        raw: b
      }));

      const orders = (ordersData || []).map((o: any) => ({
        id: o.id,
        created_at: o.created_at,
        customerName: o.users?.name || o.shipping_address?.name || 'Customer',
        customerEmail: o.users?.email || o.shipping_address?.email,
        customerPhone: o.users?.phone || o.shipping_address?.phone,
        type: 'E-commerce',
        amount: Number(o.total_amount || o.subtotal || o.total || 0),
        status: o.status || 'pending',
        raw: o
      }));

      const combined = [...bookings, ...orders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrdersList(combined);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Handle Manual Status Change
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    setStatusUpdating(true);

    try {
      const table = selectedOrder.type === 'Service Hire' ? 'bookings' : 'orders';
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      const updated = { ...selectedOrder, status: newStatus };
      setSelectedOrder(updated);
      setOrdersList(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
      setToastMessage(`Order status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFulfillShiprocket = async () => {
    if (!selectedOrder) return;
    setFulfilling(true);
    try {
      const response = await createShiprocketOrder({
        order_id: selectedOrder.id,
        order_date: selectedOrder.created_at,
        pickup_location: 'Camqrew HQ',
        billing_customer_name: selectedOrder.customerName,
        billing_address: selectedOrder.raw?.shipping_address?.addressLine1 || 'Unknown',
        billing_city: selectedOrder.raw?.shipping_address?.city || 'Unknown',
        billing_pincode: selectedOrder.raw?.shipping_address?.pincode || '000000',
        billing_state: selectedOrder.raw?.shipping_address?.state || 'Unknown',
        billing_country: 'India',
        billing_email: selectedOrder.raw?.shipping_address?.email || selectedOrder.customerEmail || 'test@camqrew.in',
        billing_phone: selectedOrder.raw?.shipping_address?.phone || selectedOrder.customerPhone || '0000000000',
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
      const updatedOrder = { 
        ...selectedOrder, 
        status: 'shipped', 
        raw: { 
          ...selectedOrder.raw, 
          awb_code: response.awb_code, 
          courier_name: response.courier_name 
        } 
      };
      setSelectedOrder(updatedOrder);
      setOrdersList(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));

      setToastMessage(`Dispatched via ${response.courier_name}! AWB: ${response.awb_code} 🚚`);
    } catch (error: any) {
      console.error(error);
      alert('Failed to fulfill via Shiprocket.');
    } finally {
      setFulfilling(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filter orders
  const filteredOrders = ordersList.filter(o => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.id?.toLowerCase().includes(q);
      const matchName = o.customerName?.toLowerCase().includes(q);
      const matchEmail = o.customerEmail?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEmail) return false;
    }

    if (typeFilter === 'hire' && o.type !== 'Service Hire') return false;
    if (typeFilter === 'ecom' && o.type !== 'E-commerce') return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'paid' && !['paid', 'accepted', 'completed'].includes(o.status)) return false;
      if (statusFilter === 'pending' && !['pending', 'processing'].includes(o.status)) return false;
      if (statusFilter === 'shipped' && o.status !== 'shipped') return false;
      if (statusFilter === 'cancelled' && o.status !== 'cancelled') return false;
    }

    return true;
  });

  return (
    <div className="admin-page-content">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-floating-toast">
          <CheckCircle2 size={18} color="var(--accent)" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="toast-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Order Tracking & Fulfillment</h1>
          <p className="admin-page-subtitle">
            Manage equipment shipments, milestone escrow hires & courier logistics
          </p>
        </div>

        <div className="admin-header-controls">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            title="Refresh orders from database"
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Hub */}
      <div className="admin-filter-hub">
        <div className="admin-search-field">
          <Search size={16} className="search-field-icon" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, customer name, email..."
            className="admin-input-clean"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="clear-search-btn">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="admin-segmented-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All Types ({ordersList.length})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${typeFilter === 'hire' ? 'active' : ''}`}
            onClick={() => setTypeFilter('hire')}
          >
            Service Hires
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${typeFilter === 'ecom' ? 'active' : ''}`}
            onClick={() => setTypeFilter('ecom')}
          >
            E-Commerce
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="admin-segmented-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Status
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'paid' ? 'active' : ''}`}
            onClick={() => setStatusFilter('paid')}
          >
            Paid / Active
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
            onClick={() => setStatusFilter('shipped')}
          >
            Shipped
          </button>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Order Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const shortId = order.id ? order.id.slice(0, 8).toUpperCase() : 'ORDER';
                const isPaid = ['completed', 'paid', 'accepted'].includes(order.status);
                const isPending = ['pending', 'processing'].includes(order.status);

                return (
                  <tr key={order.id} className="admin-row-hover">
                    <td>
                      <div className="admin-order-id-cell">
                        <span className="order-id-text">{shortId}</span>
                        <button 
                          type="button" 
                          className="copy-id-btn"
                          onClick={() => copyToClipboard(order.id, order.id)}
                          title="Copy Full UUID"
                        >
                          {copiedId === order.id ? <Check size={12} color="var(--accent)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="admin-user-name">{order.customerName}</div>
                      {order.customerEmail && (
                        <div className="admin-user-email">{order.customerEmail}</div>
                      )}
                    </td>

                    <td>
                      <span className={`admin-pill-badge ${order.type === 'Service Hire' ? 'primary' : 'accent'}`}>
                        {order.type}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(order.amount)}
                      </div>
                    </td>

                    <td>
                      <span className={`admin-pill-badge ${isPaid ? 'success' : (isPending ? 'warning' : 'danger')}`}>
                        <span className={`status-live-dot ${isPaid ? '' : (isPending ? 'warning' : 'danger')}`} />
                        <span>{order.status || 'Pending'}</span>
                      </span>
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(order.created_at)}
                    </td>

                    <td>
                      <div className="admin-actions-cell">
                        <button 
                          type="button" 
                          className="admin-btn-action admin-btn-inspect"
                          onClick={() => setSelectedOrder(order)}
                          title="Inspect Order & Fulfillment"
                        >
                          <Eye size={15} />
                          <span>Details</span>
                        </button>

                        {/* Functional Refresh Sync row */}
                        <button 
                          type="button" 
                          className="admin-table-icon-btn" 
                          onClick={() => fetchOrders(true)}
                          title="Refresh"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-table-empty">
                      <Package size={36} color="var(--text-muted)" />
                      <div className="empty-title">No orders found</div>
                      <div className="empty-sub">
                        {searchQuery ? `No orders match "${searchQuery}"` : 'No orders recorded under this filter.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Order Details & Shiprocket Fulfillment Modal */}
      {selectedOrder && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal-card-md" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">
                  Order Details: {selectedOrder.id ? selectedOrder.id.slice(0, 8).toUpperCase() : ''}
                </h2>
                <p className="admin-modal-sub">
                  Created on {new Date(selectedOrder.created_at).toLocaleString()} • {selectedOrder.type}
                </p>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedOrder(null)}
                className="admin-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-scroll-area">
              {/* Order Status Changer Dropdown */}
              <div className="order-status-bar">
                <span style={{ fontWeight: 600, fontSize: 14 }}>Status Management:</span>
                <select 
                  className="admin-select-status"
                  value={selectedOrder.status || 'pending'}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  disabled={statusUpdating}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="accepted">Accepted</option>
                  <option value="paid">Paid</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Customer & Shipping Split */}
              <div className="dossier-meta-grid">
                <div className="dossier-meta-item">
                  <Mail size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Customer Name</span>
                    <span className="dossier-value">{selectedOrder.customerName}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <Phone size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Phone Contact</span>
                    <span className="dossier-value">
                      {selectedOrder.raw?.shipping_address?.phone || selectedOrder.customerPhone || 'Not shared'}
                    </span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <MapPin size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Delivery Destination</span>
                    <span className="dossier-value">
                      {selectedOrder.raw?.shipping_address ? (
                        `${selectedOrder.raw.shipping_address.city || ''}, ${selectedOrder.raw.shipping_address.state || ''} - ${selectedOrder.raw.shipping_address.pincode || ''}`
                      ) : (selectedOrder.raw?.location_details || 'Digital Service Hire')}
                    </span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <DollarSign size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Total Amount</span>
                    <span className="dossier-value" style={{ color: 'var(--accent)', fontWeight: 800 }}>
                      {formatCurrency(selectedOrder.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="order-summary-box">
                <div className="order-summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.raw?.subtotal || selectedOrder.raw?.total_amount || selectedOrder.amount)}</span>
                </div>
                {selectedOrder.raw?.tax > 0 && (
                  <div className="order-summary-row">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedOrder.raw.tax)}</span>
                  </div>
                )}
                {selectedOrder.raw?.shipping_fee > 0 && (
                  <div className="order-summary-row">
                    <span>Shipping Fee</span>
                    <span>{formatCurrency(selectedOrder.raw.shipping_fee)}</span>
                  </div>
                )}
                <div className="order-summary-row total">
                  <span>Total Settled</span>
                  <span>{formatCurrency(selectedOrder.amount)}</span>
                </div>
              </div>

              {/* Shiprocket Fulfillment Integration */}
              {selectedOrder.type === 'E-commerce' && (
                <div className="shiprocket-box">
                  <div className="shiprocket-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                      <Truck size={18} color="var(--accent)" />
                      <span>Shiprocket Courier Logistics</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-secondary)' }}>
                      {selectedOrder.raw?.awb_code ? (
                        `Fulfilled via ${selectedOrder.raw.courier_name || 'Courier'} • AWB: ${selectedOrder.raw.awb_code}`
                      ) : (
                        'Generate courier pickup label & AWB tracking for this shipment'
                      )}
                    </p>
                  </div>

                  {!selectedOrder.raw?.awb_code ? (
                    <button 
                      type="button" 
                      className="admin-btn admin-btn-primary"
                      onClick={handleFulfillShiprocket}
                      disabled={fulfilling}
                    >
                      {fulfilling ? <Loader2 size={15} className="admin-spin-icon" /> : <Truck size={15} />}
                      <span>{fulfilling ? 'Generating AWB...' : 'Fulfill via Shiprocket'}</span>
                    </button>
                  ) : (
                    <span className="admin-pill-badge success">
                      <CheckCircle2 size={14} />
                      <span>Label Generated</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
