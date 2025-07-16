/** @format */
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  IconTrendingUp, 
  IconTrendingDown, 
  IconMinus,
  IconLoader,
} from "@tabler/icons-react";
interface StatCard {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    type: "up" | "down" | "neutral";
  };
  isLoading?: boolean;
  className?: string;
}
interface AdminStatsCardsProps {
  cards: StatCard[];
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
}
export function AdminStatsCards({ 
  cards, 
  className,
  columns = 4 
}: AdminStatsCardsProps) {
  const getGridClass = () => {
    switch (columns) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-1 md:grid-cols-2";
      case 3:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      case 4:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
      case 5:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";
      case 6:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6";
      default:
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    }
  };
  return (
    <div className={cn("grid gap-4", getGridClass(), className)}>
      {cards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
}
function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading,
  className,
}: StatCard) {
  const getTrendIcon = (type: "up" | "down" | "neutral") => {
    switch (type) {
      case "up":
        return <IconTrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <IconTrendingDown className="h-4 w-4 text-red-600" />;
      case "neutral":
        return <IconMinus className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };
  const getTrendColor = (type: "up" | "down" | "neutral") => {
    switch (type) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "neutral":
        return "text-gray-600";
      default:
        return "text-muted-foreground";
    }
  };
  return (
    <Card className={cn("admin-stat-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="admin-stat-label">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <IconLoader className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <div className="admin-stat-value">
              {typeof value === "number" ? value.toLocaleString() : value}
            </div>
          )}
          {trend && !isLoading && (
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(trend.type)}
              <span className={getTrendColor(trend.type)}>
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-muted-foreground">{trend.label}</span>
            </div>
          )}
          {description && (
            <p className="admin-stat-description">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// Pre-built common stat cards
export const CommonStatCards = {
  users: (count: number, isLoading?: boolean) => ({
    title: "Total Users",
    value: count,
    icon: <IconTrendingUp className="h-4 w-4" />,
    isLoading,
  }),
  activeUsers: (count: number, trend?: number, isLoading?: boolean) => ({
    title: "Active Users",
    value: count,
    trend: trend ? {
      value: trend,
      label: "from last month",
      type: trend > 0 ? "up" as const : trend < 0 ? "down" as const : "neutral" as const,
    } : undefined,
    isLoading,
  }),
  revenue: (amount: number, currency: string = "$", trend?: number, isLoading?: boolean) => ({
    title: "Revenue",
    value: `${currency}${amount.toLocaleString()}`,
    trend: trend ? {
      value: trend,
      label: "from last month",
      type: trend > 0 ? "up" as const : trend < 0 ? "down" as const : "neutral" as const,
    } : undefined,
    isLoading,
  }),
  orders: (count: number, trend?: number, isLoading?: boolean) => ({
    title: "Orders",
    value: count,
    trend: trend ? {
      value: trend,
      label: "from last month",
      type: trend > 0 ? "up" as const : trend < 0 ? "down" as const : "neutral" as const,
    } : undefined,
    isLoading,
  }),
  parcels: (count: number, description?: string, isLoading?: boolean) => ({
    title: "Total Parcels",
    value: count,
    description,
    isLoading,
  }),
  leads: (count: number, trend?: number, isLoading?: boolean) => ({
    title: "Leads",
    value: count,
    trend: trend ? {
      value: trend,
      label: "from last month",
      type: trend > 0 ? "up" as const : trend < 0 ? "down" as const : "neutral" as const,
    } : undefined,
    isLoading,
  }),
};
