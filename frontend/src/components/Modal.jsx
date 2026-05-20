import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`panel w-full ${widths[size]} max-h-[90vh] overflow-auto`}
            initial={{ y: 20, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display font-semibold text-lg text-gold-400 tracking-wide">
                {title}
              </h2>
              <button onClick={onClose} className="text-slate-500 hover:text-gold-400 transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-slate-300 text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className={danger ? 'btn-danger' : 'btn-gold'}
          onClick={() => { onConfirm(); onClose(); }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
