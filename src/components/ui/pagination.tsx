/** @format */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  showRowsPerPage?: boolean;
  showFirstLast?: boolean;
  maxPageButtons?: number;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showRowsPerPage = true,
  showFirstLast = true,
  maxPageButtons = 5,
  pageSizeOptions = [5, 10, 20, 50, 100],
  className = '',
}: PaginationProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Generate page numbers to display
  const generatePageNumbers = () => {
    const pages: number[] = [];
    const maxPages = Math.min(maxPageButtons, totalPages);

    if (totalPages <= maxPageButtons) {
      // Show all pages if total pages is less than max buttons
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range around current page
      let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
      let end = Math.min(totalPages, start + maxPages - 1);

      // Adjust start if we're near the end
      if (end - start + 1 < maxPages) {
        start = Math.max(1, end - maxPages + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t ${className}`}>
      {/* Rows per page selector */}
      {showRowsPerPage && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => {
              const newItemsPerPage = Number(value);
              onItemsPerPageChange(newItemsPerPage);
              // Reset to first page when changing items per page
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Page navigation - only show if there are multiple pages */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {/* First page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
          )}

          {/* Previous page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>

          {/* Page number buttons */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            ))}
          </div>

          {/* Next page button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>

          {/* Last page button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          )}
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>
            Showing {startIndex + 1}-{endIndex} of {totalItems} items
            {totalPages > 1 && (
              <span className="ml-2">
                • Page {currentPage} of {totalPages}
              </span>
            )}
          </>
        ) : (
          'No items found'
        )}
      </div>
    </div>
  );
}

// Hook for managing pagination state
export function usePagination(
  totalItems: number,
  initialItemsPerPage: number = 10,
  initialPage: number = 1
) {
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Reset to first page when total items change significantly
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
    handleItemsPerPageChange,
    setCurrentPage,
    setItemsPerPage,
  };
}
