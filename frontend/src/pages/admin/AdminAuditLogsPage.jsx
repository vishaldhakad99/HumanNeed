import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=25`);
      if (res.data) {
        setLogs(res.data);
        if (res.meta) setTotalPages(res.meta.totalPages);
      }
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-brand-dark">Security & Platform Audit Logs</h1>
        <p className="text-xs text-brand-muted mt-0.5">
          Immutable audit record of authentication, seller approvals, and privileged operations
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
      ) : logs.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-subtle overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Action Event</th>
                <th className="p-4">User</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 font-bold text-brand-royal whitespace-nowrap">{log.action}</td>
                  <td className="p-4 font-sans text-xs">
                    {log.user ? (
                      <div>
                        <span className="font-bold text-brand-dark">{log.user.name}</span>
                        <p className="text-[10px] text-slate-400">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">System / Anonymous</span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="p-4 max-w-xs truncate text-slate-600">
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-400">No audit events recorded yet.</div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-brand-dark disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-600 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white border border-slate-200 text-brand-dark disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
