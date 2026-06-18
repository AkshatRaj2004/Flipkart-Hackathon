import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import type { TrafficEvent } from '../../types';
import { PriorityBadge } from '../ui/KPICard';

const columnHelper = createColumnHelper<TrafficEvent>();

interface EventsTableProps {
  data: TrafficEvent[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function EventsTable({ data, total, page, pageSize, onPageChange, loading }: EventsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(() => [
    columnHelper.accessor('id', { header: 'ID', cell: info => <span className="font-mono text-[10px]">{info.getValue()}</span> }),
    columnHelper.accessor('event_type', { header: 'Type' }),
    columnHelper.accessor('event_cause', {
      header: 'Cause',
      cell: info => <span className="capitalize">{info.getValue().replace(/_/g, ' ')}</span>,
    }),
    columnHelper.accessor('zone', { header: 'Zone', cell: info => info.getValue() || '—' }),
    columnHelper.accessor('junction', {
      header: 'Junction',
      cell: info => <span className="max-w-[120px] truncate block">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: info => <PriorityBadge priority={info.getValue()} />,
    }),
    columnHelper.accessor('status', { header: 'Status', cell: info => <span className="capitalize">{info.getValue()}</span> }),
    columnHelper.accessor('requires_road_closure', {
      header: 'Closure',
      cell: info => info.getValue() ? <span className="text-red-400">Yes</span> : <span className="text-slate-500">No</span>,
    }),
    columnHelper.accessor('start_datetime', {
      header: 'Start',
      cell: info => new Date(info.getValue()).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }),
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-xs">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-white/10 bg-white/[0.03]">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-[10px] uppercase tracking-widest text-slate-400 font-medium whitespace-nowrap cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ChevronsUpDown className="w-3 h-3 opacity-40" />
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">Loading events...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-slate-500">No events found</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2.5 text-slate-300 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{total.toLocaleString()} total events</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="p-1.5 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono">Page {page + 1} of {totalPages || 1}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-1.5 rounded border border-white/10 hover:bg-white/5 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
