import type { Item, Unit } from "../types";

/**
 * Converte texto digitado em número seguro.
 * Aceita vírgula ou ponto decimal; se houver vírgula, pontos são
 * tratados como separador de milhar. Inválidos/negativos viram 0.
 */
export function num(v: string): number {
  if (!v) return 0;
  let s = v.trim().replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Formata moeda BRL. */
export function brl(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Subtotal do item: preço × quantidade/peso. */
export function subtotal(item: Pick<Item, "price" | "qty">): number {
  return item.price * item.qty;
}

/** Rótulo da quantidade: peso com até 3 casas decimais, unidade inteira. */
export function qtyLabel(item: Pick<Item, "unit" | "qty">): string {
  if (item.unit === "kg") {
    const qty = item.qty.toFixed(3).replace(/\.?0+$/, "");
    return `${qty.replace(".", ",")} kg`;
  }
  return `${item.qty} un`;
}

/** Rótulo do campo de preço conforme o tipo de venda. */
export function priceLabel(unit: Unit): string {
  return unit === "kg" ? "Preço por kg" : "Preço por unidade";
}

/** Rótulo do campo de quantidade conforme o tipo de venda. */
export function qtyFieldLabel(unit: Unit): string {
  return unit === "kg" ? "Peso (kg)" : "Quantidade";
}

/** Texto de exibição do valor de quantidade editado (kg com vírgula). */
export function qtyValueLabel(item: Pick<Item, "unit" | "qty">): string {
  if (item.unit === "kg") return String(item.qty).replace(".", ",");
  return String(item.qty);
}
