import type { CarrinhoState, Item, ShoppingList } from "../types";

const V1_KEY = "carrinho:v1";
const KEY = "carrinho:v2";

function newList(name: string, items: Item[] = [], mode: ShoppingList["mode"] = "plan"): ShoppingList {
  return { id: Date.now(), name, mode, items };
}

/** Normaliza um valor lido do storage; descarta o que estiver corrompido. */
function coerce(raw: unknown): CarrinhoState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<CarrinhoState>;
  if (!Array.isArray(s.lists) || s.lists.length === 0) return null;
  const lists = s.lists.filter(
    (l) => l && typeof l.id === "number" && Array.isArray(l.items),
  );
  if (lists.length === 0) return null;
  const activeId = lists.some((l) => l.id === s.activeId)
    ? (s.activeId as number)
    : lists[0].id;
  const archived = Array.isArray(s.archived)
    ? s.archived.filter(
        (a) => a && typeof a.id === "number" && Array.isArray(a.items),
      )
    : [];
  return { activeId, lists, archived };
}

/**
 * Carrega o estado v2 do localStorage. Na primeira leitura, migra a lista
 * v1 (`carrinho:v1`) como "Minha lista". Retorna estado válido mesmo com
 * storage vazio, indisponível ou corrompido.
 */
export function load(): CarrinhoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = coerce(JSON.parse(raw));
      if (parsed) return parsed;
    }

    // Primeira execução: migra a v1, se existir
    const v1Raw = localStorage.getItem(V1_KEY);
    if (v1Raw) {
      try {
        const v1 = JSON.parse(v1Raw) as { mode?: string; items?: Item[] };
        if (Array.isArray(v1.items) && v1.items.length > 0) {
          const list = newList("Minha lista", v1.items, v1.mode === "shop" ? "shop" : "plan");
          const state: CarrinhoState = {
            activeId: list.id,
            lists: [list],
            archived: [],
          };
          localStorage.setItem(KEY, JSON.stringify(state));
          return state;
        }
      } catch {
        /* v1 corrompida — segue com estado vazio */
      }
    }

    // Estado inicial: uma lista vazia pronta para usar
    const list = newList("Minha lista");
    return { activeId: list.id, lists: [list], archived: [] };
  } catch {
    const list = newList("Minha lista");
    return { activeId: list.id, lists: [list], archived: [] };
  }
}

/** Persiste o estado; falhas de storage não derrubam o app. */
export function save(state: CarrinhoState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage indisponível — segue sem persistir */
  }
}

/** Cria uma lista nova com nome sugerido (Semana X). */
export function createList(state: CarrinhoState, name: string): CarrinhoState {
  const list = newList(name);
  return { ...state, activeId: list.id, lists: [...state.lists, list] };
}

/** Renomeia uma lista. */
export function renameListIfNeeded(state: CarrinhoState, id: number, name: string): CarrinhoState {
  return {
    ...state,
    lists: state.lists.map((l) => (l.id === id ? { ...l, name } : l)),
  };
}

/** Exclui uma lista; se for a ativa, ativa a anterior ou a primeira. */
export function deleteList(state: CarrinhoState, id: number): CarrinhoState {
  const idx = state.lists.findIndex((l) => l.id === id);
  if (idx === -1) return state;
  const lists = state.lists.filter((l) => l.id !== id);
  if (lists.length === 0) {
    const fresh = newList("Minha lista");
    return { ...state, activeId: fresh.id, lists: [fresh] };
  }
  const activeId =
    state.activeId === id
      ? (lists[Math.min(idx, lists.length - 1)] ?? lists[0]).id
      : state.activeId;
  return { ...state, activeId, lists };
}

/** Arquiva uma cópia datada e zera os checks da lista, voltando ao plan. */
export function archiveList(state: CarrinhoState, id: number): CarrinhoState {
  const list = state.lists.find((l) => l.id === id);
  if (!list) return state;
  const archived = [
    {
      id: Date.now(),
      name: list.name,
      finishedAt: Date.now(),
      items: list.items,
    },
    ...state.archived,
  ];
  const lists = state.lists.map((l) =>
    l.id === id
      ? { ...l, mode: "plan" as const, items: l.items.map((i) => ({ ...i, done: false })) }
      : l,
  );
  return { ...state, lists, archived };
}

/** Restaura um arquivo como lista ativa nova (mantém o original arquivado). */
export function restoreArchive(state: CarrinhoState, archivedId: number): CarrinhoState {
  const a = state.archived.find((x) => x.id === archivedId);
  if (!a) return state;
  const list = newList(a.name, a.items.map((i) => ({ ...i, done: false })));
  return { ...state, activeId: list.id, lists: [...state.lists, list] };
}

/** Exclui um arquivo. */
export function deleteArchive(state: CarrinhoState, archivedId: number): CarrinhoState {
  return {
    ...state,
    archived: state.archived.filter((a) => a.id !== archivedId),
  };
}
