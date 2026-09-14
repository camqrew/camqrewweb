import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, CalendarCheck } from 'lucide-react';
import { supabase } from '../api/supabaseClient';

export default function Dashboard() {
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

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Fetch total users & breakdown
        const { data: usersData } = await supabase.from('users').select('role');
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

        // 2. Fetch total bookings (orders) and calculate revenue
        const { data: bookings } = await supabase.from('bookings').select('total_amount, status');
        let totalRev = 0;
        let totalOrders = 0;
        if (bookings) {
          totalOrders += bookings.length;
          bookings.forEach(b => {
            if (b.status === 'completed' || b.status === 'paid' || b.status === 'accepted') {
              totalRev += (b.total_amount || 0);
            }
          });
        }
        
        // Add e-commerce orders if table exists
        const { data: orders } = await supabase.from('orders').select('total_amount, subtotal, status');
        if (orders) {
          totalOrders += orders.length;
          orders.forEach(o => {
            if (o.status !== 'cancelled') {
              totalRev += Number(o.total_amount || o.subtotal || 0);
            }
          });
        }

        setStats(prev => ({ ...prev, revenue: totalRev, orders: totalOrders }));

        // 3. Low stock alerts from official products
        const { data: lowStockProducts } = await supabase.from('products').select('id, stock_quantity, in_stock').or('in_stock.eq.false,stock_quantity.lte.3');
        if (lowStockProducts) {
          setStats(prev => ({ ...prev, lowStock: lowStockProducts.length }));
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getPercentage = (count: number) => {
    if (stats.users === 0) return '0%';
    return Math.round((count / stats.users) * 100) + '%';
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading live ecosystem metrics...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Analytics</h1>
          <p className="page-subtitle">Real-time pulse of the Obsidian Orbit ecosystem</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="stat-title">Total Revenue</span>
            <div style={{ backgroundColor: "var(--bg-surface)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
              <DollarSign size={20} color="var(--accent)" />
            </div>
          </div>
          <span className="stat-value">{formatCurrency(stats.revenue)}</span>
          <span style={{ fontSize: 13, color: 'var(--success)', marginTop: 8, fontWeight: 600 }}>Live Data</span>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="stat-title">Total Orders</span>
            <div style={{ backgroundColor: "var(--bg-surface)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
              <CalendarCheck size={20} color="var(--accent)" />
            </div>
          </div>
          <span className="stat-value">{stats.orders}</span>
          <span style={{ fontSize: 13, color: 'var(--success)', marginTop: 8, fontWeight: 600 }}>Bookings & Sales</span>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="stat-title">Total Users</span>
            <div style={{ backgroundColor: "var(--bg-surface)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
              <Users size={20} color="var(--accent)" />
            </div>
          </div>
          <span className="stat-value">{stats.users}</span>
          <span style={{ fontSize: 13, color: 'var(--success)', marginTop: 8, fontWeight: 600 }}>Registered Accounts</span>
        </div>

        <div className="card stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span className="stat-title">Low Stock Alerts</span>
            <div style={{ backgroundColor: "var(--bg-surface)", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
              <TrendingUp size={20} color={stats.lowStock > 0 ? "var(--danger)" : "var(--success)"} />
            </div>
          </div>
          <span className="stat-value">{stats.lowStock}</span>
          <span style={{ fontSize: 13, color: stats.lowStock > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 8, fontWeight: 600 }}>
            {stats.lowStock > 0 ? "Action Required" : "All Good"}
          </span>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 20, marginBottom: 24, fontWeight: 800 }}>User Role Breakdown</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Customers</td>
                <td style={{ fontWeight: 700 }}>{roleBreakdown.customer}</td>
                <td>{getPercentage(roleBreakdown.customer)}</td>
                <td><span className="badge badge-success">Healthy</span></td>
              </tr>
              <tr>
                <td>Professionals</td>
                <td style={{ fontWeight: 700 }}>{roleBreakdown.professional}</td>
                <td>{getPercentage(roleBreakdown.professional)}</td>
                <td><span className="badge badge-success">Growing</span></td>
              </tr>
              <tr>
                <td>Studios</td>
                <td style={{ fontWeight: 700 }}>{roleBreakdown.studio}</td>
                <td>{getPercentage(roleBreakdown.studio)}</td>
                <td><span className="badge badge-warning">Needs Focus</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
