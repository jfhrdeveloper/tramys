"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icons";

export const PAGE_SIZE_DEFAULT = 8;

export function usePagination<T>(items: T[], pageSize: number = PAGE_SIZE_DEFAULT) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = useMemo(() => items.slice(start, end), [items, start, end]);
  const needsPagination = total > pageSize;

  return {
    page: safePage,
    setPage,
    pageSize,
    total,
    totalPages,
    pageItems,
    needsPagination,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(end, total),
  };
}

export function Pagination({
  page, totalPages, onChange, total, rangeStart, rangeEnd, label = "registros",
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  const push = (n: number | "…") => pages.push(n);
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i);
  } else {
    push(1);
    if (page > 3) push("…");
    const from = Math.max(2, page - 1);
    const to   = Math.min(totalPages - 1, page + 1);
    for (let i = from; i <= to; i++) push(i);
    if (page < totalPages - 2) push("…");
    push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, padding: "0 8px",
    borderRadius: 8, border: "1px solid var(--border)",
    background: "var(--bg)", color: "var(--text-muted)",
    fontWeight: 600, fontSize: 12, cursor: "pointer",
    fontFamily: "'DM Mono', monospace",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s",
  };
  const btnActive: React.CSSProperties = {
    ...btnBase,
    background: "var(--brand)", color: "#fff",
    border: "1px solid var(--brand)",
  };
  const btnDisabled: React.CSSProperties = {
    ...btnBase, opacity: 0.4, cursor: "not-allowed",
  };

  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 10, padding: "12px 16px", borderTop: "1px solid var(--border)",
      flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'DM Mono', monospace" }}>
        {rangeStart}–{rangeEnd} de {total} {label}
      </div>
      <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          style={page <= 1 ? btnDisabled : btnBase}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-flex", lineHeight: 0 }}>
            <Icon name="chevron_right" size={12} />
          </span>
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} style={{ ...btnBase, border: "none", background: "transparent", cursor: "default" }}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              style={p === page ? btnActive : btnBase}
              aria-current={p === page ? "page" : undefined}
            >{p}</button>
          )
        )}
        <button
          type="button"
          aria-label="Página siguiente"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          style={page >= totalPages ? btnDisabled : btnBase}
        >
          <span style={{ display: "inline-flex", lineHeight: 0 }}>
            <Icon name="chevron_right" size={12} />
          </span>
        </button>
      </div>
    </div>
  );
}
