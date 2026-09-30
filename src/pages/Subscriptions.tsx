import { useState, useEffect } from 'react';
import { 
  Users, 
  Ban, 
  User, 
  Search, 
  RefreshCw, 
  Download, 
  Eye, 
  X, 
  CheckCircle2, 
  Calendar,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { supabase } from '../api/supabaseClient';
import { isCustomAvatar } from '../utils/avatarUtils';

export default function Subscriptions() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Inspection Modal & Toast
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  async function fetchUsers(isManual = false) {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error('Error fetching users', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string, userName: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }

      setToastMessage(`Updated ${userName}'s role to ${newRole.toUpperCase()}!`);
    } catch (e: any) {
      alert(e.message || 'Failed to update role');
    }
  }

  async function handleBan(userId: string, userName: string) {
    if (!window.confirm(`Are you sure you want to delete and revoke access for "${userName}"?`)) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) setSelectedUser(null);
      setToastMessage(`Account for "${userName}" was removed from the directory.`);
    } catch (e: any) {
      alert(e.message || 'Failed to remove user');
    } finally {
      setActionLoading(false);
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['User ID', 'Name', 'Email', 'Phone', 'Role', 'Registered Date'],
      ...users.map(u => [
        u.id,
        `"${u.name || ''}"`,
        u.email || '',
        u.phone || '',
        u.role || 'customer',
        u.created_at || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `camqrew_users_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Filter users by search and role
  const filteredUsers = users.filter(user => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = user.name?.toLowerCase().includes(q);
      const matchEmail = user.email?.toLowerCase().includes(q);
      const matchPhone = user.phone?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }

    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    return true;
  });

  const roleCounts = {
    all: users.length,
    customer: users.filter(u => u.role === 'customer').length,
    professional: users.filter(u => u.role === 'professional').length,
    studio: users.filter(u => u.role === 'studio').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

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
          <h1 className="admin-page-title">User Control & Subscriptions</h1>
          <p className="admin-page-subtitle">
            Manage permissions, community accounts, creator tiers & platform access
          </p>
        </div>

        <div className="admin-header-controls">
          <button 
            type="button" 
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            title="Refresh directory"
          >
            <RefreshCw size={15} className={refreshing ? 'admin-spin-icon' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button 
            type="button" 
            className="admin-btn admin-btn-primary"
            onClick={handleExportCSV}
            title="Export CSV of all users"
          >
            <Download size={15} />
            <span>Export CSV</span>
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
            placeholder="Search by name, email, phone..."
            className="admin-input-clean"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="clear-search-btn">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter Tabs */}
        <div className="admin-segmented-tabs">
          <button 
            type="button" 
            className={`admin-tab-btn ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            All ({roleCounts.all})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${roleFilter === 'customer' ? 'active' : ''}`}
            onClick={() => setRoleFilter('customer')}
          >
            Clients ({roleCounts.customer})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${roleFilter === 'professional' ? 'active' : ''}`}
            onClick={() => setRoleFilter('professional')}
          >
            Pros ({roleCounts.professional})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${roleFilter === 'studio' ? 'active' : ''}`}
            onClick={() => setRoleFilter('studio')}
          >
            Studios ({roleCounts.studio})
          </button>
          <button 
            type="button" 
            className={`admin-tab-btn ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            Admins ({roleCounts.admin})
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>User Profile</th>
                <th>Assigned Role</th>
                <th>Phone Contact</th>
                <th>Joined</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const userName = u.name || 'Anonymous User';
                const userEmail = u.email || 'No email registered';

                return (
                  <tr key={u.id} className="admin-row-hover">
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar-box">
                          {isCustomAvatar(u.avatar) ? (
                            <img src={u.avatar} alt={userName} />
                          ) : (
                            <User size={20} color="var(--text-muted)" />
                          )}
                        </div>
                        <div className="admin-user-meta">
                          <div className="admin-user-name">{userName}</div>
                          <div className="admin-user-email">{userEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ width: 145 }}>
                        <CustomSelect 
                          size="sm"
                          value={u.role || 'customer'}
                          onChange={(val) => handleRoleChange(u.id, val, userName)}
                          options={[
                            { value: 'admin', label: '🛡️ Admin' },
                            { value: 'studio', label: '🏢 Studio' },
                            { value: 'professional', label: '⭐ Professional' },
                            { value: 'customer', label: '👤 Customer' },
                          ]}
                          searchable={false}
                        />
                      </div>
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {u.phone || '—'}
                    </td>

                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDate(u.created_at)}
                    </td>

                    <td>
                      <span className="admin-pill-badge success">
                        <span className="status-live-dot" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td>
                      <div className="admin-actions-cell">
                        <button 
                          type="button" 
                          className="admin-table-icon-btn"
                          onClick={() => setSelectedUser(u)}
                          title="Inspect User Details"
                        >
                          <Eye size={16} />
                        </button>

                        <button 
                          type="button" 
                          className="admin-table-icon-btn danger"
                          onClick={() => handleBan(u.id, userName)}
                          disabled={actionLoading}
                          title="Ban / Revoke User Access"
                        >
                          <Ban size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-table-empty">
                      <Users size={36} color="var(--text-muted)" />
                      <div className="empty-title">No users found</div>
                      <div className="empty-sub">
                        {searchQuery ? `No accounts match "${searchQuery}"` : 'No users under selected role.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect User Modal */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-card-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="dossier-avatar-wrap">
                  {isCustomAvatar(selectedUser.avatar) ? (
                    <img src={selectedUser.avatar} alt="Avatar" />
                  ) : (
                    <User size={26} color="var(--text-muted)" />
                  )}
                </div>
                <div>
                  <h2 className="admin-modal-title">{selectedUser.name || 'User Profile'}</h2>
                  <p className="admin-modal-sub">{selectedUser.role ? selectedUser.role.toUpperCase() : 'CUSTOMER'}</p>
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => setSelectedUser(null)}
                className="admin-modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-scroll-area">
              <div className="dossier-meta-grid" style={{ gridTemplateColumns: '1fr', gap: 12 }}>
                <div className="dossier-meta-item">
                  <Mail size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Email Address</span>
                    <span className="dossier-value">{selectedUser.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <Phone size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Phone Contact</span>
                    <span className="dossier-value">{selectedUser.phone || 'Not shared'}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <Calendar size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">Account Created</span>
                    <span className="dossier-value">{formatDate(selectedUser.created_at)}</span>
                  </div>
                </div>

                <div className="dossier-meta-item">
                  <Shield size={16} className="dossier-meta-icon" />
                  <div>
                    <span className="dossier-label">User ID (UUID)</span>
                    <span className="dossier-value" style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                      {selectedUser.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button 
                type="button" 
                className="admin-btn admin-btn-danger"
                onClick={() => handleBan(selectedUser.id, selectedUser.name || 'User')}
              >
                <Ban size={15} />
                <span>Revoke Access</span>
              </button>

              <button 
                type="button" 
                className="admin-btn admin-btn-primary"
                onClick={() => setSelectedUser(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
