import Modal from './Modal.jsx';
import { Spinner } from './Spinner.jsx';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading && <Spinner size={16} />} {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-navy-600">{message}</p>
    </Modal>
  );
}
