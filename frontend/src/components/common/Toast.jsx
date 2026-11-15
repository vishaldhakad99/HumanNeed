import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeToast } from '../../redux/slices/uiSlice';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastItem = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-brand-success shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-brand-error shrink-0" />,
    info: <Info className="w-5 h-5 text-brand-royal shrink-0" />,
  };

  const borders = {
    success: 'border-l-4 border-brand-success',
    error: 'border-l-4 border-brand-error',
    info: 'border-l-4 border-brand-royal',
  };

  return (
    <div
      className={`flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-premium border border-slate-100 ${
        borders[toast.type] || borders.info
      } animate-slide-in min-w-[300px] max-w-md pointer-events-auto`}
    >
      {icons[toast.type] || icons.info}
      <p className="text-sm font-medium text-brand-dark flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const toasts = useSelector((state) => state.ui.toasts);
  const dispatch = useDispatch();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={(id) => dispatch(removeToast(id))}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
