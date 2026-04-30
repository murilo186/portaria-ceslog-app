import Button from "./Button";
import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onClose={isConfirming ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
          {cancelLabel}
        </Button>
        <Button type="button" onClick={() => void onConfirm()} disabled={isConfirming}>
          {isConfirming ? "Processando..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
