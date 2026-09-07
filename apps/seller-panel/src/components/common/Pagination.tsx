type PaginationProps = {
  page: number
  totalPages: number
  onPrevious: () => void
  onNext: () => void
  onPageChange?: (page: number) => void
  pageSize?: number
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export function Pagination({ page, totalPages, onPrevious, onNext, onPageChange, pageSize, pageSizeOptions = [10, 20, 50], onPageSizeChange }: PaginationProps) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
    if (totalPages <= 5) return index + 1
    if (page <= 3) return index + 1
    if (page >= totalPages - 2) return totalPages - 4 + index
    return page - 2 + index
  })

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <button type="button" onClick={onPrevious} disabled={page <= 1} className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">
        Previous
      </button>
      <div className="flex items-center gap-1" aria-label="Pagination pages">
        {pages.map((pageNumber) => <button key={pageNumber} type="button" onClick={() => onPageChange?.(pageNumber)} disabled={!onPageChange} aria-current={pageNumber === page ? 'page' : undefined} className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold ${pageNumber === page ? 'bg-[#2d80d8] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{pageNumber}</button>)}
        <span className="px-2 text-xs">of {Math.max(totalPages, 1)}</span>
      </div>
      <button type="button" onClick={onNext} disabled={page >= totalPages} className="rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40">
        Next
      </button>
      {pageSize && onPageSizeChange ? <label className="flex items-center gap-2 text-xs text-slate-500">Rows<select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700">{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></label> : null}
    </div>
  )
}
