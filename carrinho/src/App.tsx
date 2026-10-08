import { useEffect, useState } from "react";
import type { Item, Mode, ShoppingList } from "./types";
import { brl, qtyLabel, subtotal } from "./lib/format";
import {
  archiveList,
  createList,
  deleteArchive,
  deleteList,
  load,
  renameListIfNeeded,
  restoreArchive,
  save,
} from "./lib/storage";
import PriceTag from "./components/PriceTag";
import Sheet from "./components/Sheet";
import Logo from "./components/Logo";
import Dialog from "./components/Dialog";
import ListMenu from "./components/ListMenu";
import ListPrompt from "./components/ListPrompt";

export default function App() {
  const [state, setState] = useState(load);
  const [sheetItem, setSheetItem] = useState<Item | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState<
    | { kind: "create"; suggested: string }
    | { kind: "rename"; list: ShoppingList }
    | null
  >(null);
  const [confirmDeleteList, setConfirmDeleteList] = useState<ShoppingList | null>(null);
  const [finishDialog, setFinishDialog] = useState(false);

  useEffect(() => {
    save(state);
  }, [state]);

  const active =
    state.lists.find((l) => l.id === state.activeId) ?? state.lists[0];
  const { mode, items } = active;
  const total = items.reduce((s, i) => s + subtotal(i), 0);
  const inCart = items.filter((i) => i.done);
  const cartTotal = inCart.reduce((s, i) => s + subtotal(i), 0);
  const allDone = items.length > 0 && inCart.length === items.length;
  const shopping = mode === "shop";

  /** Atualiza a lista ativa preservando as demais. */
  function patchActive(patch: Partial<ShoppingList> | ((l: ShoppingList) => ShoppingList)) {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) =>
        l.id === s.activeId
          ? typeof patch === "function"
            ? patch(l)
            : { ...l, ...patch }
          : l,
      ),
    }));
  }

  function setMode(mode: Mode) {
    patchActive({ mode });
  }

  function addItem(data: Omit<Item, "id" | "done">) {
    patchActive((l) => ({
      ...l,
      items: [...l.items, { ...data, id: Date.now(), done: false }],
    }));
  }

  function updateItem(id: number, data: Partial<Omit<Item, "id">>) {
    patchActive((l) => ({
      ...l,
      items: l.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  }

  function removeItem(id: number) {
    patchActive((l) => ({ ...l, items: l.items.filter((i) => i.id !== id) }));
  }

  function toggleDone(id: number) {
    patchActive((l) => ({
      ...l,
      items: l.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }));
  }

  function clearList() {
    patchActive({ items: [] });
    setConfirmClear(false);
  }

  function openSheet(item: Item | null) {
    setSheetItem(item);
    setSheetOpen(true);
  }

  /** Opções do diálogo de conclusão: arquivar e manter / só zerar. */
  function finishKeep() {
    setState((s) => archiveList(s, s.activeId));
    setFinishDialog(false);
  }

  /** Concluir apagando a lista por completo. */
  function finishDelete() {
    setState((s) => deleteList(s, s.activeId));
    setFinishDialog(false);
  }

  return (
    <div className="app" data-mode={mode}>
      <header className="topbar">
        <button
          type="button"
          className="brand list-switch"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <img src="/marca.svg" alt="" width="28" height="28" />
          <span className="brand-titles">
            <span className="brand-app">Anoto</span>
            <span className="brand-list">
              {active.name}
              {shopping ? " · no mercado" : ""}
            </span>
          </span>
          <span className="brand-caret" aria-hidden="true">
            ▾
          </span>
        </button>

        {shopping ? (
          <button
            type="button"
            className="link"
            onClick={() => setMode("plan")}
          >
            Voltar à lista
          </button>
        ) : (
          items.length > 0 && (
            <button
              type="button"
              className="link danger-text"
              onClick={() => setConfirmClear(true)}
            >
              Limpar
            </button>
          )
        )}
      </header>

      {menuOpen && (
        <ListMenu
          state={state}
          onSwitch={(id) => {
            setState((s) => ({ ...s, activeId: id }));
            setMenuOpen(false);
          }}
          onCreate={() => {
            setPrompt({ kind: "create", suggested: `Lista ${state.lists.length + 1}` });
            setMenuOpen(false);
          }}
          onRename={(list) => {
            setPrompt({ kind: "rename", list });
            setMenuOpen(false);
          }}
          onDelete={(list) => {
            setConfirmDeleteList(list);
            setMenuOpen(false);
          }}
          onRestoreArchive={(id) => {
            setState((s) => restoreArchive(s, id));
            setMenuOpen(false);
          }}
          onDeleteArchive={(id) => {
            setState((s) => deleteArchive(s, id));
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}

      <main className="list" aria-label="Itens da lista">
        {items.length === 0 ? (
          <div className="empty">
            <Logo className="empty-logo" />
            <p>
              {shopping
                ? "Nada para comprar."
                : `“${active.name}” está vazia. Toque em + para adicionar o primeiro item.`}
            </p>
          </div>
        ) : (
          <ul>
            {items.map((item) => {
              const st = subtotal(item);
              const row = (
                <>
                  <span
                    className={
                      item.done ? "item-name done-text" : "item-name"
                    }
                  >
                    {item.name}
                  </span>
                  <span className="item-detail">
                    {brl(item.price)} · {qtyLabel(item)}
                  </span>
                  <span className="item-subtotal">{brl(st)}</span>
                </>
              );

              return shopping ? (
                <li key={item.id}>
                  <button
                    type="button"
                    className="item item-check"
                    role="checkbox"
                    aria-checked={item.done}
                    onClick={() => toggleDone(item.id)}
                  >
                    <span className="check" aria-hidden="true">
                      {item.done ? "✓" : ""}
                    </span>
                    {row}
                  </button>
                  <button
                    type="button"
                    className="item-edit"
                    onClick={() => openSheet(item)}
                  >
                    editar
                  </button>
                </li>
              ) : (
                <li key={item.id}>
                  <button
                    type="button"
                    className="item"
                    onClick={() => openSheet(item)}
                  >
                    {row}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {shopping && items.length > 0 && (
        <div className="progress-wrap">
          <div className="progress-info">
            <span>
              {inCart.length} de {items.length} no carrinho
            </span>
            <span>{brl(cartTotal)}</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={items.length}
            aria-valuenow={inCart.length}
          >
            <span
              style={{ width: `${(inCart.length / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <footer className="dock">
        <PriceTag
          label={shopping ? "No carrinho" : "Total"}
          value={shopping ? cartTotal : total}
        />
        {shopping ? (
          <button
            type="button"
            className="btn primary"
            disabled={!allDone}
            onClick={() => setFinishDialog(true)}
          >
            {allDone ? "Concluir compra" : `Faltam ${items.length - inCart.length}`}
          </button>
        ) : (
          <button
            type="button"
            className="btn primary"
            disabled={items.length === 0}
            onClick={() => setMode("shop")}
          >
            Ir às compras
          </button>
        )}
        <button
          type="button"
          className="fab"
          aria-label="Adicionar item"
          onClick={() => openSheet(null)}
        >
          +
        </button>
      </footer>

      {confirmClear && (
        <Dialog label="Limpar lista" onClose={() => setConfirmClear(false)}>
          <p>Apagar todos os itens de “{active.name}”? Isso não pode ser desfeito.</p>
          <div className="sheet-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setConfirmClear(false)}
            >
              Cancelar
            </button>
            <button type="button" className="btn danger" onClick={clearList}>
              Apagar
            </button>
          </div>
        </Dialog>
      )}

      {confirmDeleteList && (
        <Dialog
          label="Excluir lista"
          onClose={() => setConfirmDeleteList(null)}
        >
          <p>
            Excluir a lista “{confirmDeleteList.name}” com{" "}
            {confirmDeleteList.items.length} itens? Isso não pode ser desfeito.
          </p>
          <div className="sheet-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => setConfirmDeleteList(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                setState((s) => deleteList(s, confirmDeleteList.id));
                setConfirmDeleteList(null);
              }}
            >
              Excluir
            </button>
          </div>
        </Dialog>
      )}

      {prompt && (
        <ListPrompt
          title={prompt.kind === "create" ? "Nova lista" : "Renomear lista"}
          initial={prompt.kind === "rename" ? prompt.list.name : prompt.suggested}
          confirmLabel={prompt.kind === "create" ? "Criar" : "Salvar"}
          onClose={() => setPrompt(null)}
          onConfirm={(name) => {
            setState((s) =>
              prompt.kind === "create"
                ? createList(s, name)
                : renameListIfNeeded(s, prompt.list.id, name),
            );
            setPrompt(null);
          }}
        />
      )}

      {finishDialog && (
        <Dialog label="Concluir compra" onClose={() => setFinishDialog(false)}>
          <p>Compra concluída! O que fazer com “{active.name}”?</p>
          <div className="sheet-actions column">
            <button
              type="button"
              className="btn primary full"
              onClick={finishKeep}
            >
              Arquivar compra e manter lista
            </button>
            <button
              type="button"
              className="btn ghost full"
              onClick={() => {
                patchActive((l) => ({
                  ...l,
                  mode: "plan",
                  items: l.items.map((i) => ({ ...i, done: false })),
                }));
                setFinishDialog(false);
              }}
            >
              Só zerar os itens marcados
            </button>
            <button
              type="button"
              className="btn ghost danger-text full"
              onClick={finishDelete}
            >
              Apagar esta lista
            </button>
          </div>
        </Dialog>
      )}

      {sheetOpen && (
        <Sheet
          item={sheetItem}
          onClose={() => setSheetOpen(false)}
          onDelete={() => {
            if (sheetItem) removeItem(sheetItem.id);
            setSheetOpen(false);
          }}
          onSave={(data) => {
            if (sheetItem) updateItem(sheetItem.id, data);
            else addItem(data);
            setSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}
