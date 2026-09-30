import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  DollarSign, 
  X, 
  Search, 
  Eye, 
  User, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

export default function Disputes() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'cancelled' | 'refunded'>('all');
  
  // Modals & Action States
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [refundModalDispute, setRefundModalDispute] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function fetchDisputes(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          client:users!customer_id (id, name, email, phone),
          professional:professional_profiles!professional_id (
            id,
            title,
            users (id, name, email, phone)
          )
        `)
        .in('status', ['cancelled', 'flagged', 'disputed', 'refunded'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      const formatted = (data || []).map((d: any) => ({
        id: d.id,
        customerId: d.client?.id || d.customer_id,
        customerName: d.client?.name || 'Customer',
        customerEmail: d.client?.email,
        customerPhone: d.client?.phone,
        proId: d.professional?.users?.id || d.professional_id,
        proName: d.professional?.users?.name || 'Creator',
        proEmail: d.professional?.users?.email,
        proTitle: d.professional?.title || 'Professional',
        amount: d.total_amount || 0,
        serviceTitle: d.service_title || 'Custom Service Booking',
        status: d.status || 'flagged',
        issue: d.status === 'cancelled' 
          ? 'Cancellation / No-Show' 
          : (d.status === 'refunded' ? 'Escrow Refunded' : 'Dispute Flagged by User'),
        created_at: d.created_at,
        raw: d
      }));

      setDisputes(formatted);
    } catch (e) {
      console.error('Failed to load disputes', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Handle Refund Action
  async function executeRefund() {
    if (!refundModalDispute) return;
    setActionLoading(true);

    try {
      // 1. Update booking status to refunded
      const { error: bookingErr } = await supabase
        .from('bookings')
        .update({ status: 'refunded' })
        .eq('id', refundModalDispute.id);

      if (bookingErr) throw bookingErr;

      // 2. Also update milestones if existing
      try {
        await supabase
          .from('booking_milestones')
          .update({ status: 'refunded' })
          .eq('booking_id', refundModalDispute.id);
      } catch (err) {
        // Milestones table might not be present or populated
      }

      // Update local state
      setDisputes(prev => prev.map(d => d.id === refundModalDispute.id ? { ...d, status: 'refunded', issue: 'Escrow Refunded' } : d));
      if (selectedDispute?.id === refundModalDispute.id) {
        setSelectedDispute({ ...selectedDispute, status: 'refunded', issue: 'Escrow Refunded' });
      }

      setToastMessage(`Refunded ₹${refundModalDispute.amount.toLocaleString('en-IN')} to ${refundModalDispute.customerName} successfully!`);
      setRefundModalDispute(null);
    } catch (err: any) {
      alert(err.message || 'Failed to process refund');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Dispute Resolution
  async function handleResolve(disputeId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', disputeId);

      if (error) throw error;

      setDisputes(prev => prev.filter(d => d.id !== disputeId));
      if (selectedDispute?.id === disputeId) setSelectedDispute(null);

      setToastMessage('Dispute marked as resolved.');
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle View Chat Navigation
  const handleViewChat = (dispute: any) => {
    // Navigate to chat with the customer or creator ID
    const targetUserId = dispute.customerId || dispute.proId;
    if (targetUserId) {
      navigate(`/chat?userId=${targetUserId}`);
    } else {
      alert('No user chat identifier found for this record.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filter disputes
  const filteredDisputes = disputes.filter(d => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = d.id?.toLowerCase().includes(q);
      const matchCust = d.customerName?.toLowerCase().includes(q);
      const matchPro = d.proName?.toLowerCase().includes(q);
      const matchService = d.serviceTitle?.toLowerCase().includes(q);
      if (!matchId && !matchCust && !matchPro && !matchService) return false;
    }

    if (statusFilter === 'flagged' && d.status !== 'flagged' && d.status !== 'disputed') return false;
    if (statusFilter === 'cancelled' && d.status !== 'cancelled') return false;
    if (statusFilter === 'refunded' && d.status !== 'refunded') return false;

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
          <h1 className="admin-page-title">Dispute & Escrow Resolution</h1>
          <p className="admin-page-subtitle">
            Mediate client complaints, review chat evidence, and authorize escrow refunds
          </p>
        </div>

        <div className="admin-header-controls">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchDisputes(true)}
            disabled={refreshing}
            title="Refresh disputes"
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Hub */}
      <div className="admin-filter-hub">
        <div className="admin-search-field">
          <div className="search-field-icon-wrap">
            <Search size={15} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ID, customer, professional..."
            className="admin-input-clean"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="clear-search-btn" title="Clear Search">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="admin-segmented-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Disputes ({disputes.length})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'flagged' ? 'active' : ''}`}
            onClick={() => setStatusFilter('flagged')}
          >
            Flagged
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${statusFilter === 'refunded' ? 'active' : ''}`}
            onClick={() => setStatusFilter('refunded')}
          >
            Refunded
          </button>
        </div>
      </div>

      {/* Disputes Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Client</th>
                <th>Professional</th>
                <th>Escrow Amount</th>
                <th>Issue Details</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map(dispute => {
                const shortId = dispute.id ? dispute.id.slice(0, 8).toUpperCase() : 'BOOKING';
                const isRefunded = dispute.status === 'refunded';

                return (
                  <tr key={dispute.id} className="admin-row-hover">
                    <td>
                      <span className="order-id-text">{shortId}</span>
                    </td>

                    <td>
                      <div className="admin-user-name">{dispute.customerName}</div>
                      {dispute.customerEmail && (
                        <div className="admin-user-email">{dispute.customerEmail}</div>
                      )}
                    </td>

                    <td>
                      <div className="admin-user-name">{dispute.proName}</div>
                      <div className="admin-user-email">{dispute.proTitle}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {formatCurrency(dispute.amount)}
                      </div>
                    </td>

                    <td>
                      <div className={`dispute-issue-tag ${isRefunded ? 'refunded' : 'danger'}`}>
                        {isRefunded ? (
                          <CheckCircle2 size={14} color="var(--accent)" />
                        ) : (
                          <AlertTriangle size={14} color="var(--danger)" />
                        )}
                        <span>{dispute.issue}</span>
                      </div>
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(dispute.created_at)}
                    </td>

                    <td>
                      <div className="admin-actions-cell">
                        {/* Functioning View Chat */}
                        <button 
                          type="button" 
                          className="admin-btn-action admin-btn-inspect"
                          onClick={() => handleViewChat(dispute)}
                          title="Open Message Thread"
                        >
                          <MessageSquare size={14} />
                          <span>Chat</span>
                        </button>

                        {/* Functioning Refund Button */}
                        {!isRefunded && (
                          <button 
                            type="button" 
                            className="admin-btn-action admin-btn-approve"
                            onClick={() => setRefundModalDispute(dispute)}
                            title="Authorize Escrow Refund"
                          >
                            <RotateCcw size={14} />
                            <span>Refund</span>
                          </button>
                        )}

                        {/* Inspect Details */}
                        <button 
                          type="button" 
                          className="admin-table-icon-btn"
                          onClick={() => setSelectedDispute(dispute)}
                          title="Inspect Dispute"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDisputes.length === 0 && !loading && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-table-empty">
                      <ShieldCheck size={36} color="var(--accent)" />
                      <div className="empty-title">No disputes recorded</div>
                      <div className="empty-sub">
                        {searchQuery ? `No disputes match "${searchQuery}"` : 'All booking milestones and client interactions are healthy.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Dispute Modal */}
      {selectedDispute && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedDispute(null)}>
          <div className="admin-modal-card-md" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">
                  Dispute Case: {selectedDispute.id ? selectedDispute.id.slice(0, 8).toUpperCase() : ''}
                </h2>
                <p className="admin-modal-sub">
                  Created on {new Date(selectedDispute.created_at).toLocaleString()}
                </p>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedDispute(null)}
                className="admin-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-scroll-area">
              <div className="dossier-meta-grid">
                <div className="dossier-meta-item">
                  <User size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Client</span>
                    <span className="dossier-value">{selectedDispute.customerName}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <User size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Professional</span>
                    <span className="dossier-value">{selectedDispute.proName}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <DollarSign size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Escrow Value</span>
                    <span className="dossier-value" style={{ color: 'var(--accent)', fontWeight: 800 }}>
                      {formatCurrency(selectedDispute.amount)}
                    </span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <AlertTriangle size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Flagged Reason</span>
                    <span className="dossier-value">{selectedDispute.issue}</span>
                  </div>
                </div>
              </div>

              <div className="dossier-section">
                <h3 className="dossier-section-title">Service Details</h3>
                <p className="dossier-bio-text">
                  {selectedDispute.serviceTitle} • Scheduled date: {selectedDispute.raw?.date || 'N/A'}
                </p>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary"
                onClick={() => handleViewChat(selectedDispute)}
              >
                <MessageSquare size={15} />
                <span>Open Direct Chat</span>
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                {selectedDispute.status !== 'refunded' && (
                  <button 
                    type="button" 
                    className="admin-btn admin-btn-danger"
                    onClick={() => {
                      setRefundModalDispute(selectedDispute);
                    }}
                  >
                    <RotateCcw size={15} />
                    <span>Refund Client</span>
                  </button>
                )}

                <button 
                  type="button" 
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleResolve(selectedDispute.id)}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={15} />
                  <span>Mark Resolved</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {refundModalDispute && (
        <div className="admin-modal-backdrop" onClick={() => setRefundModalDispute(null)}>
          <div className="admin-modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title" style={{ color: 'var(--danger)' }}>
                  Confirm Escrow Refund
                </h2>
                <p className="admin-modal-sub">This action releases escrow funds back to the client.</p>
              </div>
              <button 
                type="button" 
                onClick={() => setRefundModalDispute(null)}
                className="admin-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-scroll-area">
              <div style={{ padding: '16px 0', fontSize: 14, lineHeight: 1.6 }}>
                <div>Are you sure you want to refund:</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent)', margin: '8px 0' }}>
                  {formatCurrency(refundModalDispute.amount)}
                </div>
                <div>To client <strong style={{ color: 'var(--text-primary)' }}>{refundModalDispute.customerName}</strong> for booking <strong style={{ color: 'var(--text-primary)' }}>{refundModalDispute.serviceTitle}</strong>?</div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-btn admin-btn-secondary"
                onClick={() => setRefundModalDispute(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button 
                type="button" 
                className="admin-btn admin-btn-danger"
                onClick={executeRefund}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing Refund...' : 'Confirm Full Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
