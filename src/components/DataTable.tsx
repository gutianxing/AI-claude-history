import { Table } from 'antd'
import type { TableProps } from 'antd'

interface DataTableProps<T> extends Omit<TableProps<T>, 'title'> {
  title?: string
}

export function DataTable<T>({ title, ...props }: DataTableProps<T>) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      {title && <h2 className="text-lg font-semibold mb-4 dark:text-white">{title}</h2>}
      <Table<T> {...props} />
    </div>
  )
}