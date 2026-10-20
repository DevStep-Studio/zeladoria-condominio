import type { ReactNode } from "react";
import { TableWrap } from "@/components/ui";

export type ColumnDef<T> = {
  header: ReactNode;
  accessorKey?: keyof T;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  priority?: "high" | "medium" | "low";
};

export type MobileCardProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  rows?: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  className?: string;
  onClick?: () => void;
};

export function MobileDataCard({
  title,
  subtitle,
  badge,
  rows = [],
  actions,
  className = "",
  onClick,
}: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 transition-colors ${
        onClick ? "cursor-pointer hover:border-slate-300" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
            {title}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{subtitle}</p>
          )}
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {rows.length > 0 && (
        <div className="space-y-1.5 text-xs">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                {r.label}
              </span>
              <span className="text-xs font-semibold text-slate-800 text-right">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {actions && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  renderMobileCard,
  emptyState,
  className = "",
}: {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  renderMobileCard?: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
}) {
  if (data.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Visualização Mobile: Cards individuais elegantes */}
      {renderMobileCard ? (
        <div className="block md:hidden space-y-3">
          {data.map((item, index) => (
            <div key={keyExtractor(item, index)}>
              {renderMobileCard(item, index)}
            </div>
          ))}
        </div>
      ) : null}

      {/* Visualização Desktop / Tablet: Tabela com rolagem protegida */}
      <div className={`${renderMobileCard ? "hidden md:block" : "block"} w-full`}>
        <TableWrap>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.headerClassName}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIdx) => (
              <tr key={keyExtractor(item, rowIdx)}>
                {columns.map((col, colIdx) => {
                  const val = col.render
                    ? col.render(item)
                    : col.accessorKey
                    ? (item[col.accessorKey] as ReactNode)
                    : null;
                  return (
                    <td key={colIdx} className={col.className}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}
