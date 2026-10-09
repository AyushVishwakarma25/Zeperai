import React from 'react';

/* ==========================================================================
   APP UI & DATA TABLES
   Font: DM Sans
   Weight: Regular / Medium weight
   Ensures dense numbers, metrics, and prompt inputs remain perfectly readable.
   ========================================================================== */

export interface DataTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ children, className = '', ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
      <table className={`w-full text-left border-collapse font-dmsans ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '', ...props }) => {
  return (
    <thead className={`bg-[#F8F9FB] border-b border-[#E5E7EB] ${className}`} {...props}>
      {children}
    </thead>
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  isHoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  isHoverable = true,
  className = '',
  ...props
}) => {
  const hoverClass = isHoverable ? 'hover:bg-slate-50/80 transition-colors' : '';
  return (
    <tr className={`border-b border-[#E5E7EB] last:border-b-0 ${hoverClass} ${className}`} {...props}>
      {children}
    </tr>
  );
};

export interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th
      className={`px-4 py-3 font-dmsans font-medium text-xs text-[#5F6673] uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  isNumber?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  isNumber = false,
  className = '',
  ...props
}) => {
  const fontClass = isNumber
    ? 'font-dmsans font-medium tabular-nums text-[#080B12]'
    : 'font-dmsans font-normal text-[#080B12]';

  return (
    <td className={`px-4 py-3.5 text-sm ${fontClass} ${className}`} {...props}>
      {children}
    </td>
  );
};
