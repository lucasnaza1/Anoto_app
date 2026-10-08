import { useEffect, useRef } from "react";
import type { CarrinhoState, ShoppingList } from "../types";
import { brl, subtotal } from "../lib/format";

function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

/**
 * Menu suspenso do seletor de listas: troca a ativa, cria nova, renomeia,
 * exclui e gerencia compras arquivadas (restaurar/excluir).
 */
export default function ListMenu({
  state,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  onRestoreArchive,
  onDeleteArchive,
  onClose,
}: {
  state: CarrinhoState;
  onSwitch: (id: number) => void;
  onCreate: () => void;
  onRename: (list: ShoppingList) => void;
  onDelete: (list: ShoppingList) => void;
  onRestoreArchive: (id: number) => void;
  onDeleteArchive: (id: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao tocar fora ou ao pressionar Esc
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="listmenu" ref={ref} role="menu" aria-label="Listas">
      <ul>
        {state.lists.map((l) => (
          <li key={l.id}>
            <button
              type="button"
              role="menuitemradio"
              aria-checked={l.id === state.activeId}
              className={l.id === state.activeId ? "on" : ""}
              onClick={() => onSwitch(l.id)}
            >
              <span className="listmenu-name">{l.name}</span>
              <span className="listmenu-meta">
                {l.items.length} itens ·{" "}
                {brl(l.items.reduce((s, i) => s + subtotal(i), 0))}
              </span>
            </button>
            <button
              type="button"
              className="listmenu-act"
              aria-label={`Renomear ${l.name}`}
              onClick={() => onRename(l)}
            >
              renomear
            </button>
            <button
              type="button"
              className="listmenu-act danger-text"
              aria-label={`Excluir ${l.name}`}
              onClick={() => onDelete(l)}
            >
              excluir
            </button>
          </li>
        ))}
      </ul>

      <button type="button" role="menuitem" className="listmenu-new" onClick={onCreate}>
        + Nova lista
      </button>

      {state.archived.length > 0 && (
        <div className="listmenu-archived">
          <p>Compras concluídas</p>
          <ul>
            {state.archived.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onRestoreArchive(a.id)}
                >
                  <span className="listmenu-name">{a.name}</span>
                  <span className="listmenu-meta">
                    {formatDate(a.finishedAt)} · {a.items.length} itens
                  </span>
                </button>
                <button
                  type="button"
                  className="listmenu-act danger-text"
                  aria-label={`Excluir arquivo de ${a.name}`}
                  onClick={() => onDeleteArchive(a.id)}
                >
                  excluir
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
