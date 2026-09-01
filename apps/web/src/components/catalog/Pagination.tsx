import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis-left' | 'ellipsis-right')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = []

  pages.push(1)

  if (currentPage > 4) {
    pages.push('ellipsis-left')
  }

  const startPage = Math.max(2, currentPage - 1)
  const endPage = Math.min(totalPages - 1, currentPage + 1)

  for (let page = startPage; page <= endPage; page++) {
    if (!pages.includes(page)) {
      pages.push(page)
    }
  }

  if (currentPage < totalPages - 3) {
    pages.push('ellipsis-right')
  }

  pages.push(totalPages)

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages,
  )

  const pages = getPageNumbers(safeCurrentPage, totalPages)

  const goToPage = (page: number) => {
    if (disabled) return

    const nextPage = Math.min(
      Math.max(page, 1),
      totalPages,
    )

    if (nextPage !== safeCurrentPage) {
      onPageChange(nextPage)
    }
  }

  const isFirstPage = safeCurrentPage === 1
  const isLastPage = safeCurrentPage === totalPages

  return (
    <nav
      aria-label="Product pagination"
      className={`mt-8 flex flex-col items-center gap-4 ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {/* First */}
        <button
          type="button"
          aria-label="Go to first page"
          onClick={() => goToPage(1)}
          disabled={disabled || isFirstPage}
          className="
            hidden h-10 w-10 items-center justify-center rounded-full
            border border-slate-200 bg-white text-slate-700
            transition-all hover:border-slate-300 hover:bg-slate-50
            focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/20
            disabled:cursor-not-allowed disabled:opacity-40
            sm:flex
          "
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous */}
        <button
          type="button"
          aria-label="Go to previous page"
          onClick={() => goToPage(safeCurrentPage - 1)}
          disabled={disabled || isFirstPage}
          className="
            flex h-10 items-center justify-center gap-1 rounded-full
            border border-slate-200 bg-white px-3 text-sm font-semibold
            text-slate-700 transition-all
            hover:border-slate-300 hover:bg-slate-50
            focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/20
            disabled:cursor-not-allowed disabled:opacity-40
            sm:px-4
          "
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {pages.map((page) => {
            if (page === 'ellipsis-left' || page === 'ellipsis-right') {
              return (
                <span
                  key={page}
                  aria-hidden="true"
                  className="
                    flex h-10 w-7 items-center justify-center
                    text-sm font-semibold text-slate-400
                  "
                >
                  …
                </span>
              )
            }

            const isActive = page === safeCurrentPage

            return (
              <button
                key={page}
                type="button"
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => goToPage(page)}
                disabled={disabled}
                className={`
                  flex h-10 w-10 items-center justify-center rounded-full
                  text-sm font-semibold transition-all
                  focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/20
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${
                    isActive
                      ? 'bg-[#1f2d4d] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next */}
        <button
          type="button"
          aria-label="Go to next page"
          onClick={() => goToPage(safeCurrentPage + 1)}
          disabled={disabled || isLastPage}
          className="
            flex h-10 items-center justify-center gap-1 rounded-full
            border border-slate-200 bg-white px-3 text-sm font-semibold
            text-slate-700 transition-all
            hover:border-slate-300 hover:bg-slate-50
            focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/20
            disabled:cursor-not-allowed disabled:opacity-40
            sm:px-4
          "
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last */}
        <button
          type="button"
          aria-label="Go to last page"
          onClick={() => goToPage(totalPages)}
          disabled={disabled || isLastPage}
          className="
            hidden h-10 w-10 items-center justify-center rounded-full
            border border-slate-200 bg-white text-slate-700
            transition-all hover:border-slate-300 hover:bg-slate-50
            focus:outline-none focus:ring-2 focus:ring-[#1f2d4d]/20
            disabled:cursor-not-allowed disabled:opacity-40
            sm:flex
          "
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>

      {/* Page information */}
      <p className="text-xs font-medium text-slate-500">
        Page{' '}
        <span className="font-semibold text-slate-700">
          {safeCurrentPage}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-700">
          {totalPages}
        </span>
      </p>
    </nav>
  )
}