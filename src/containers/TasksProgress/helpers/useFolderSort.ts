import { ColumnSortEvent } from 'primereact/column'
import { FolderRow } from './formatTaskProgressForTable'
import { useMemo } from 'react'

export interface CustomColumnSortEvent extends ColumnSortEvent {
  data: FolderRow[]
}

export type ProgressTableSortFunction = (
  a: FolderRow,
  b: FolderRow,
  { field, order }: { field: string; order: ColumnSortEvent['order'] },
) => number

export const useFolderSort = (tableData: FolderRow[]) => {
  // Separate the parent and child rows with useMemo (used for sorting)
  const [parents, children] = useMemo(() => {
    const parentRows: FolderRow[] = []
    const childRows: FolderRow[] = []
    for (const row of tableData) {
      if (row.__isParent) {
        parentRows.push(row)
      } else {
        childRows.push(row)
      }
    }
    return [parentRows, childRows]
  }, [tableData])

  const sortFolderRows = (
    event: CustomColumnSortEvent,
    customSortFunction?: ProgressTableSortFunction,
  ): FolderRow[] => {
    const { field, order } = event

    // Comparator function to handle sorting
    const compareFields: ProgressTableSortFunction = (a, b, { field, order }) => {
      const fieldA = a[field]
      const fieldB = b[field]

      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return (order ?? 1) * fieldA.localeCompare(fieldB)
      }
      return (order ?? 1) * (fieldA < fieldB ? -1 : fieldA > fieldB ? 1 : 0)
    }

    const sortFunction = customSortFunction || compareFields

    // Sort parents and children independently
    parents.sort((a, b) => sortFunction(a, b, { field, order }))
    children.sort((a, b) => sortFunction(a, b, { field, order }))

    // Create a map to group children by their parent ID for quick access
    const childrenByParentId = new Map<string, FolderRow[]>()
    children.forEach((child) => {
      if (!child.__parentId) return
      const parentId = child.__parentId
      if (!childrenByParentId.has(parentId)) {
        childrenByParentId.set(parentId, [])
      }
      childrenByParentId.get(parentId)!.push(child)
    })

    // Combine parents and their corresponding children while maintaining hierarchy
    const sortedData = parents.reduce((acc, parent) => {
      acc.push(parent)
      const associatedChildren = childrenByParentId.get(parent.__folderId)
      if (associatedChildren) {
        acc.push(...associatedChildren)
      }
      return acc
    }, [] as FolderRow[])

    return sortedData
  }

  return (e: CustomColumnSortEvent, customSortFunction?: ProgressTableSortFunction) =>
    sortFolderRows(e, customSortFunction)
}
