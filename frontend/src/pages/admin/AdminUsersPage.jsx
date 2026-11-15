import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDispatch } from 'react-redux';
import { addToast } from '../../redux/slices/uiSlice';
import { Users, Shield, Ban, CheckCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminUsersPage = () => {
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = `?search=${encodeURIComponent(search)}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      const res = await api.get(`/admin/users${query}`);
      if (res.data) setUsers(res.data);
    } catch (e) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      dispatch(
        addToast({
          message: `User account ${currentStatus ? 'activated' : 'deactivated'}.`,
          type: 'info',
        })
      );
      fetchUsers();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      dispatch(addToast({ message: `Role updated to ${newRole}!`, type: 'success' }));
      fetchUsers();
    } catch (err) {
      dispatch(addToast({ message: err.message, type: 'error' }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark">Registered User Accounts</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage customer accounts, assign administrative roles, and enforce platform security
          </p>
        </div>

        {/* Role Filter & Search */}
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-brand-dark shadow-subtle"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>

          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-brand-dark shadow-subtle focus:outline-none focus:border-brand-royal"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading accounts...</div>
      ) : users.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-brand-dark">{u.name}</p>
                    {u.phone && <p className="text-[11px] text-slate-400">{u.phone}</p>}
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{u.email}</td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={u.role === 'admin' && u.email === 'admin@humanneed.in'}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase"
                    >
                      <option value="customer">Customer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.isBlocked
                          ? 'bg-red-50 text-brand-error'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleBlock(u._id, u.isBlocked)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                          u.isBlocked
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-red-50 text-brand-error hover:bg-red-100'
                        }`}
                      >
                        {u.isBlocked ? 'Unblock' : 'Suspend'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">No user accounts found.</div>
      )}
    </div>
  );
};

export default AdminUsersPage;
