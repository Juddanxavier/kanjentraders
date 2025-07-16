/** @format */
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}
interface AdminTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  description?: string;
  onAdd?: () => void;
  addButtonLabel?: string;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyMessage?: string;
}
export function AdminTable({
  columns,
  data,
  title,
  description,
  onAdd,
  addButtonLabel = "Add New",
  className,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = "No data available",
}: AdminTableProps) {
  // Loading state
  if (isLoading && data.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {(title || description || onAdd) && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {onAdd && (
              <Button onClick={onAdd} className="flex items-center gap-2">
                <IconPlus className="h-4 w-4" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        )}
        <div className="rounded-lg border bg-card">
          <div className="flex h-32 items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        {(title || description || onAdd) && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && <h3 className="text-lg font-semibold">{title}</h3>}
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {onAdd && (
              <Button onClick={onAdd} className="flex items-center gap-2">
                <IconPlus className="h-4 w-4" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        )}
        <div className="rounded-lg border bg-card">
          <div className="flex h-32 items-center justify-center">
            <div className="flex items-center gap-4 text-center">
              <div className="text-red-600">Error: {error}</div>
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {(title || description || onAdd) && (
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {onAdd && (
            <Button onClick={onAdd} className="flex items-center gap-2">
              <IconPlus className="h-4 w-4" />
              {addButtonLabel}
            </Button>
          )}
        </div>
      )}
      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
// Helper components for common table cells
export const StatusBadge = ({
  status,
  variant = "outline",
}: {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "success":
      case "completed":
      case "shipped":
        return "status-badge-shipped";
      case "pending":
      case "in-progress":
      case "contacted":
        return "status-badge-contacted";
      case "inactive":
      case "failed":
      case "cancelled":
        return "status-badge-failed";
      case "new":
      case "draft":
        return "status-badge-new";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };
  return (
    <Badge variant={variant} className={`${getStatusColor(status)} px-2 py-1`}>
      {status}
    </Badge>
  );
};
export const ActionButton = ({
  onClick,
  children,
  variant = "ghost",
  size = "sm",
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}) => (
  <Button onClick={onClick} variant={variant} size={size}>
    {children}
  </Button>
);
