import { brl } from "../lib/format";

/** Etiqueta amarela de preço do rodapé — elemento central da identidade. */
export default function PriceTag({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="tag" aria-live="polite">
      <span className="tag-label">{label}</span>
      <span className="tag-value">{brl(value)}</span>
    </div>
  );
}
