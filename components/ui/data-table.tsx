"use client";

import {
    flexRender,
    type Table as TanstackTable,
} from "@tanstack/react-table";

interface DataTableProps<TData> {
    table: TanstackTable<TData>;
    /** Extra classes on <thead><tr> — e.g. override font weight or color */
    headerClassName?: string;
    /** Extra classes on <tbody><tr> */
    rowClassName?: string;
    /** Padding class for <th> and <td>, defaults to "px-6 py-4" */
    cellPadding?: string;
}

export function DataTable<TData>({
    table,
    headerClassName = "bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase tracking-wider",
    rowClassName = "hover:bg-gray-50 transition-colors group",
    cellPadding = "px-6 py-4",
}: DataTableProps<TData>) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className={headerClassName}>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <th key={header.id} className={cellPadding}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y">
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className={rowClassName}>
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className={cellPadding}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
