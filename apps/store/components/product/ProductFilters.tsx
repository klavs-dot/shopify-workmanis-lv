"use client";

import { CATEGORIES } from "@/lib/categories";
import {
  PRODUCT_CONDITION_LABEL,
  type ProductCondition,
} from "@/types/product";

export interface FilterState {
  category: string;
  condition: ProductCondition | "";
  maxPrice: string;
}

export function ProductFilters({
  state,
  onChange,
  onReset,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}) {
  return (
    <aside className="space-y-6 text-sm">
      <FilterBlock title="Kategorija">
        <select
          value={state.category}
          onChange={(e) => onChange({ ...state, category: e.target.value })}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
        >
          <option value="">Visas kategorijas</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock title="Stāvoklis">
        <select
          value={state.condition}
          onChange={(e) =>
            onChange({
              ...state,
              condition: e.target.value as ProductCondition | "",
            })
          }
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2"
        >
          <option value="">Visi stāvokļi</option>
          {(Object.entries(PRODUCT_CONDITION_LABEL) as [ProductCondition, string][]).map(
            ([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            )
          )}
        </select>
      </FilterBlock>

      <FilterBlock title="Maks. cena (EUR)">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={state.maxPrice}
          onChange={(e) => onChange({ ...state, maxPrice: e.target.value })}
          placeholder="piem. 100"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 tabular"
        />
        <p className="mt-1 text-[11px] text-neutral-500">
          Tiek rādītas tikai preces zem norādītās cenas.
        </p>
      </FilterBlock>

      <button
        type="button"
        onClick={onReset}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
      >
        Notīrīt filtrus
      </button>
    </aside>
  );
}

function FilterBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {title}
      </div>
      {children}
    </div>
  );
}

export const DEFAULT_FILTER_STATE: FilterState = {
  category: "",
  condition: "",
  maxPrice: "",
};
