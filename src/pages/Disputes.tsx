import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, RefreshCcw } from 'lucide-react';
import { supabase } from '../api/supabaseClient';

export default function Disputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    setLoading(true);
    try {
      // Fetch bookings that are cancelled or flagged
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:users!customer_id(name),
          professional:professional_profiles!professional_id(users(name))
        `)
        .in('status', ['cancelled', 'flagged']);
        
      if (error) throw error;

      const formatted = (data || []).map((d: any) => ({
        id: d.id,
        customerName: d.client?.name || 'Unknown',
        proName: d.professional?.users?.name || 'Unknown',
        issue: d.status === 'cancelled' ? 'Cancellation / No Show' : 'Flagged by User',
        status: d.status
      }));

      setDisputes(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading disputes...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dispute Resolution</h1>
          <p className="page-subtitle">Manage customer complaints and flagged bookings</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Professional</th>
                <th>Issue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(dispute => (
                <tr key={dispute.id}>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>
                    {dispute.id.split('-')[0].toUpperCase()}...
                  </td>
                  <td>{dispute.customerName}</td>
                  <td>{dispute.proName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontWeight: 600 }}>
                      <AlertTriangle size={16} />
                      <span>{dispute.issue}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn"><MessageSquare size={16} /> View Chat</button>
                      <button className="btn btn-primary"><RefreshCcw size={16} /> Refund</button>
                    </div>
                  </td>
                </tr>
              ))}
              {disputes.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active disputes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
