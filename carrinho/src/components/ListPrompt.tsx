import { useEffect, useRef, useState } from "react";
import Dialog from "./Dialog";

/** Diálogo com um campo de texto: criar ou renomear uma lista. */
export default function ListPrompt({
  title,
  initial = "",
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  initial?: string;
  confirmLabel: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <Dialog label={title} onClose={onClose}>
      <p>{title}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onConfirm(name.trim());
        }}
      >
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Ex.: Churrasco de sábado"
          aria-label="Nome da lista"
        />
        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={!name.trim()}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
