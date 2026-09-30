import { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  CalendarCheck, 
  RefreshCw, 
  Download, 
  ArrowUpRight, 
  ShieldCheck, 
  Package, 
  ShieldAlert, 
  ChevronRight,
  Boxes
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    lowStock: 0,
  });
  
  const [roleBreakdown, setRoleBreakdown] = useState({
    customer: 0,
    professional: 0,
    studio: 0
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

  async function fetchStats(isManualRefresh = false) {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch total users & breakdown
      const { data: usersData } = await supabase.from('users').select('role, created_at');
      if (usersData) {
        const breakdown = { customer: 0, professional: 0, studio: 0 };
        usersData.forEach(u => {
          if (u.role === 'customer') breakdown.customer++;
          else if (u.role === 'professional') breakdown.professional++;
          else if (u.role === 'studio') breakdown.studio++;
        });
        setStats(prev => ({ ...prev, users: usersData.length }));
        setRoleBreakdown(breakdown);
      }

      // 2. Fetch total bookings & calculate revenue
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id, 
          total_amount, 
          status, 
          created_at,
          users!customer_id (name)
        `)
        .order('created_at', { ascending: false });

      let totalRev = 0;
      let totalOrders = 0;
      if (bookings) {
        totalOrders += bookings.length;
        bookings.forEach(b => {
          if (b.status === 'completed' || b.status === 'paid' || b.status === 'accepted') {
            totalRev += (b.total_amount || 0);
          }
        });
        setRecentBookings(bookings.slice(0, 5));
      }
      
      // Add e-commerce orders if table exists
      try {
        const { data: orders } = await supabase.from('orders').select('total_amount, subtotal, status');
        if (orders) {
          totalOrders += orders.length;
          orders.forEach(o => {
            if (o.status !== 'cancelled') {
              totalRev += Number(o.total_amount || o.subtotal || 0);
            }
          });
        }
      } catch (e) {
        // Table optional
      }

      setStats(prev => ({ ...prev, revenue: totalRev, orders: totalOrders }));

      // 3. Low stock alerts from official products
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('id, stock_quantity, in_stock')
        .or('in_stock.eq.false,stock_quantity.lte.3');
      if (lowStockProducts) {
        setStats(prev => ({ ...prev, lowStock: lowStockProducts.length }));
      }

    } catch (e) {
      console.error('Error fetching dashboard stats', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getPercentage = (count: number) => {
    if (stats.users === 0) return 0;
    return Math.round((count / stats.users) * 100);
  };

  // Export Platform Metrics CSV
  const handleExportReport = () => {
    const csvContent = [
      ['Metric', 'Value', 'Generated At'],
      ['Total Platform Gross Volume', stats.revenue, new Date().toISOString()],
      ['Total Processed Orders', stats.orders, new Date().toISOString()],
      ['Total Registered Accounts', stats.users, new Date().toISOString()],
      ['Low Stock Alert Items', stats.lowStock, new Date().toISOString()],
      ['Customer Accounts', roleBreakdown.customer, new Date().toISOString()],
      ['Professional Creators', roleBreakdown.professional, new Date().toISOString()],
      ['Studio Accounts', roleBreakdown.studio, new Date().toISOString()],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `camqrew_platform_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !refreshing) {
    return (
      <div className="admin-loading-screen">
        <RefreshCw size={24} className="admin-spin-icon" />
        <span>Loading live platform telemetry...</span>
      </div>
    );
  }

  return (
    <div className="admin-page-content">
      {/* Page Header with Functional Controls */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Intelligence</h1>
          <p className="admin-page-subtitle">Real-time pulse of verified commerce, creator bookings & community growth</p>
        </div>

        <div className="admin-header-controls">
          {/* Timeframe Filter Tabs */}
          <div className="admin-segmented-tabs">
            <button 
              type="button"
              className={`admin-tab-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All Time
            </button>
            <button 
              type="button"
              className={`admin-tab-btn ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => setTimeframe('month')}
            >
              This Month
            </button>
            <button 
              type="button"
              className={`admin-tab-btn ${timeframe === 'week' ? 'active' : ''}`}
              onClick={() => setTimeframe('week')}
            >
              7 Days
            </button>
          </div>

          {/* Refresh Data Button */}
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            title="Refresh database metrics"
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin-icon' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Export Report Button */}
          <button 
            type="button" 
            className="admin-btn admin-btn-primary"
            onClick={handleExportReport}
            title="Export summary CSV report"
          >
            <Download size={15} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="admin-stats-grid">
        {/* Total Revenue Card */}
        <div 
          className="admin-stat-card cursor-pointer"
          onClick={() => navigate('/admin/orders')}
          title="Click to view all revenue & order transactions"
        >
          <div className="admin-stat-head">
            <span className="admin-stat-label">Total Volume (Gross)</span>
            <div className="admin-stat-icon-wrap accent">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="admin-stat-num">{formatCurrency(stats.revenue)}</div>
          <div className="admin-stat-foot">
            <span className="admin-stat-tag success">Verified Escrow</span>
            <span className="admin-stat-action">
              <span>View Orders</span>
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div 
          className="admin-stat-card cursor-pointer"
          onClick={() => navigate('/admin/orders')}
          title="Click to track live orders and service bookings"
        >
          <div className="admin-stat-head">
            <span className="admin-stat-label">Total Transactions</span>
            <div className="admin-stat-icon-wrap primary">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="admin-stat-num">{stats.orders}</div>
          <div className="admin-stat-foot">
            <span className="admin-stat-tag info">Commerce & Hires</span>
            <span className="admin-stat-action">
              <span>View Tracking</span>
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        {/* Total Users Card */}
        <div 
          className="admin-stat-card cursor-pointer"
          onClick={() => navigate('/admin/subscriptions')}
          title="Click to manage community accounts and roles"
        >
          <div className="admin-stat-head">
            <span className="admin-stat-label">Platform Accounts</span>
            <div className="admin-stat-icon-wrap warning">
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-num">{stats.users}</div>
          <div className="admin-stat-foot">
            <span className="admin-stat-tag success">Active Directory</span>
            <span className="admin-stat-action">
              <span>Manage Roles</span>
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div 
          className="admin-stat-card cursor-pointer"
          onClick={() => navigate('/admin/inventory')}
          title="Click to inspect catalogue inventory limits"
        >
          <div className="admin-stat-head">
            <span className="admin-stat-label">Stock Health</span>
            <div className={`admin-stat-icon-wrap ${stats.lowStock > 0 ? 'danger' : 'accent'}`}>
              <Boxes size={18} />
            </div>
          </div>
          <div className="admin-stat-num">{stats.lowStock}</div>
          <div className="admin-stat-foot">
            <span className={`admin-stat-tag ${stats.lowStock > 0 ? 'danger' : 'success'}`}>
              {stats.lowStock > 0 ? 'Restock Needed' : 'Inventory Optimal'}
            </span>
            <span className="admin-stat-action">
              <span>Catalogue</span>
              <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* Quick Ops Navigation Grid */}
      <div className="admin-quick-ops-strip">
        <div className="admin-quick-op-card" onClick={() => navigate('/admin/inventory?action=new')}>
          <div className="quick-op-icon accent">
            <Package size={20} />
          </div>
          <div className="quick-op-info">
            <div className="quick-op-title">Add Gear to Catalogue</div>
            <div className="quick-op-desc">List photography or cinema equipment for sale</div>
          </div>
          <ChevronRight size={16} className="quick-op-arrow" />
        </div>

        <div className="admin-quick-op-card" onClick={() => navigate('/admin/verifications')}>
          <div className="quick-op-icon warning">
            <ShieldCheck size={20} />
          </div>
          <div className="quick-op-info">
            <div className="quick-op-title">Review KYC Applications</div>
            <div className="quick-op-desc">Approve badges for freelance photographers & creators</div>
          </div>
          <ChevronRight size={16} className="quick-op-arrow" />
        </div>

        <div className="admin-quick-op-card" onClick={() => navigate('/admin/disputes')}>
          <div className="quick-op-icon danger">
            <ShieldAlert size={20} />
          </div>
          <div className="quick-op-info">
            <div className="quick-op-title">Escrow & Disputes</div>
            <div className="quick-op-desc">Resolve flagged cancellations and milestone refunds</div>
          </div>
          <ChevronRight size={16} className="quick-op-arrow" />
        </div>
      </div>

      {/* 2-Column Split: Role Distribution & Recent Bookings */}
      <div className="admin-grid-2col">
        {/* User Role Distribution */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">User Role Distribution</h2>
              <p className="admin-card-sub">Active account segmentation across client and creator tiers</p>
            </div>
            <Link to="/admin/subscriptions" className="admin-card-link">
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="admin-role-breakdown-list">
            {/* Customers */}
            <div className="admin-role-item">
              <div className="role-item-top">
                <span className="role-name">Client Accounts</span>
                <span className="role-count">
                  <strong>{roleBreakdown.customer}</strong> ({getPercentage(roleBreakdown.customer)}%)
                </span>
              </div>
              <div className="role-progress-bar">
                <div 
                  className="role-progress-fill customer" 
                  style={{ width: `${getPercentage(roleBreakdown.customer)}%` }} 
                />
              </div>
            </div>

            {/* Professionals */}
            <div className="admin-role-item">
              <div className="role-item-top">
                <span className="role-name">Verified Professionals</span>
                <span className="role-count">
                  <strong>{roleBreakdown.professional}</strong> ({getPercentage(roleBreakdown.professional)}%)
                </span>
              </div>
              <div className="role-progress-bar">
                <div 
                  className="role-progress-fill pro" 
                  style={{ width: `${getPercentage(roleBreakdown.professional)}%` }} 
                />
              </div>
            </div>

            {/* Studios */}
            <div className="admin-role-item">
              <div className="role-item-top">
                <span className="role-name">Studios & Agencies</span>
                <span className="role-count">
                  <strong>{roleBreakdown.studio}</strong> ({getPercentage(roleBreakdown.studio)}%)
                </span>
              </div>
              <div className="role-progress-bar">
                <div 
                  className="role-progress-fill studio" 
                  style={{ width: `${getPercentage(roleBreakdown.studio)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Service Hires & Bookings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2 className="admin-card-title">Recent Service Hires</h2>
              <p className="admin-card-sub">Latest booking activity with milestone escrow</p>
            </div>
            <Link to="/admin/orders" className="admin-card-link">
              <span>View Orders</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => (
                  <tr key={b.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{b.users?.name || 'Customer'}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      {formatCurrency(b.total_amount || 0)}
                    </td>
                    <td>
                      <span className={`admin-pill-badge ${b.status === 'completed' || b.status === 'paid' ? 'success' : (b.status === 'accepted' ? 'accent' : 'warning')}`}>
                        {b.status || 'Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                      No recent bookings recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
