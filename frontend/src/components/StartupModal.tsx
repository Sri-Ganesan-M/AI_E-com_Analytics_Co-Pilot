import { Modal, Button } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

interface StartupModalProps {
  show: boolean;
  onClose: () => void;
}

export default function StartupModal({ show, onClose }: StartupModalProps) {
  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title className="d-flex align-items-center gap-2">
          <AlertTriangle className="text-warning" />
           Backend Server Notice
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          The backend for this app is deployed on a free instance.
        </p>
        <p>
          When making your first request, please wait up to a minute for the server instance to spin up. Thank you for your patience!
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
}