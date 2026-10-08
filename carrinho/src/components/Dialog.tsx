/** Diálogo modal centrado; fecha ao tocar no fundo. */
export default function Dialog({
  label,
  children,
  onClose,
}: {
  label: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
