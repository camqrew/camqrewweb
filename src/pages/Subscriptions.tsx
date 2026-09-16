import { useState, useEffect } from 'react';
import { Ban } from 'lucide-react';
import { CustomSelect } from '../components/CustomSelect';
import { supabase } from '../api/supabaseClient';

export default function Subscriptions() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(id: string, newRole: string) {
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await supabase.from('users').update({ role: newRole }).eq('id', id);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleBan(id: string) {
    if (!window.confirm('Are you sure you want to delete this user from the platform permanently?')) return;
    try {
      // Deleting user from public.users (Note: Doesn't delete from auth.users directly unless trigger exists)
      await supabase.from('users').delete().eq('id', id);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading user directory...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Control & Subscriptions</h1>
          <p className="page-subtitle">Manage user roles, accounts, and subscription tiers</p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Join Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ backgroundColor: "var(--bg-surface)", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ width: 140 }}>
                      <CustomSelect 
                        size="sm"
                        value={user.role || 'customer'}
                        onChange={(val) => handleRoleChange(user.id, val)}
                        options={[
                          { value: 'admin', label: 'Admin' },
                          { value: 'studio', label: 'Studio' },
                          { value: 'professional', label: 'Professional' },
                          { value: 'customer', label: 'Customer' },
                        ]}
                        searchable={false}
                      />
                    </div>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-danger" onClick={() => handleBan(user.id)}>
                        <Ban size={16} /> Ban
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
