import { cn } from "@/lib/utils";

/**
 * Minimal responsive table. columns: [{ key, label, className, render?(row) }]
 * Wraps in an overflow container so the page never scrolls horizontally.
 */
export function DataTable({ columns, rows, caption, emptyMessage = "Nothing to show yet.", rowKey = "id" }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500", column.className)}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row[rowKey]} className="transition-colors hover:bg-slate-50/70">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("whitespace-nowrap px-5 py-3.5 text-slate-700", column.className)}>
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
