import { useEffect, useRef, useState } from "react";
import type { Item, Unit } from "../types";
import { brl, num, priceLabel, qtyFieldLabel } from "../lib/format";

/**
 * Folha inferior (bottom sheet) de cadastro/edição de item.
 * Aberta com `item` para editar, ou sem para cadastrar novo.
 */
export default function Sheet({
  item,
  onSave,
  onDelete,
  onClose,
}: {
  item: Item | null;
  onSave: (data: { name: string; unit: Unit; price: number; qty: number }) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const editing = item !== null;
  const [name, setName] = useState(item?.name ?? "");
  const [unit, setUnit] = useState<Unit>(item?.unit ?? "un");
  const [price, setPrice] = useState(
    item && item.price > 0 ? String(item.price).replace(".", ",") : "",
  );
  const [qty, setQty] = useState(
    item && item.qty > 0 ? String(item.qty).replace(".", ",") : "",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Ao alternar Unidade/Quilo, reseta a quantidade (un→kg e vice-versa
  // não fazem sentido sem reentrada).
  function switchUnit(u: Unit) {
    if (u === unit) return;
    setUnit(u);
    setQty("");
  }

  const qtyNum = num(qty);
  const subtotalPreview = num(price) * (qtyNum || 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      unit,
      price: num(price),
      qty: unit === "un" ? Math.max(1, Math.round(qtyNum || 1)) : qtyNum,
    });
  }

  return (
    <div
      className="sheet-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Editar item" : "Novo item"}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <form onSubmit={submit}>
          <label className="field">
            <span>Item</span>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Contrafilé"
              maxLength={60}
            />
          </label>

          <div className="field" role="radiogroup" aria-label="Tipo de venda">
            <span>Tipo de venda</span>
            <div className="segmented">
              <button
                type="button"
                role="radio"
                aria-checked={unit === "un"}
                className={unit === "un" ? "on" : ""}
                onClick={() => switchUnit("un")}
              >
                Unidade
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={unit === "kg"}
                className={unit === "kg" ? "on" : ""}
                onClick={() => switchUnit("kg")}
              >
                Quilo (kg)
              </button>
            </div>
          </div>

          <div className="row-2">
            <label className="field">
              <span>{priceLabel(unit)}</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="0,00"
              />
            </label>
            <label className="field">
              <span>{qtyFieldLabel(unit)}</span>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="decimal"
                placeholder={unit === "kg" ? "0,750" : "1"}
              />
            </label>
          </div>

          <p className="preview" aria-live="polite">
            {subtotalPreview > 0 ? brl(subtotalPreview) : "—"}
          </p>

          {editing ? (
            <div className="sheet-actions">
              {confirmDelete ? (
                <button
                  type="button"
                  className="btn danger"
                  onClick={onDelete}
                >
                  Excluir de vez
                </button>
              ) : (
                <button
                  type="button"
                  className="btn ghost danger-text"
                  onClick={() => setConfirmDelete(true)}
                >
                  Excluir
                </button>
              )}
              <button
                type="submit"
                className="btn primary"
                disabled={!name.trim()}
              >
                Salvar
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="btn primary full"
              disabled={!name.trim()}
            >
              Adicionar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
