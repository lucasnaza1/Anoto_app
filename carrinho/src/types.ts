export type Unit = "un" | "kg";
export type Mode = "plan" | "shop";

export interface Item {
  id: number;
  name: string;
  unit: Unit;
  /** Preço por unidade ou por kg */
  price: number;
  /** Quantidade (un) ou peso em kg */
  qty: number;
  /** Marcado no modo compras */
  done: boolean;
}

/** Uma lista de compras ativa, com seu próprio modo plan/shop. */
export interface ShoppingList {
  id: number;
  name: string;
  mode: Mode;
  items: Item[];
}

/** Cópia datada de uma compra concluída. */
export interface ArchivedList {
  id: number;
  name: string;
  /** Data da conclusão (epoch ms) */
  finishedAt: number;
  items: Item[];
}

export interface CarrinhoState {
  activeId: number;
  lists: ShoppingList[];
  archived: ArchivedList[];
}
