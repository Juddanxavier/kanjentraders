/** @format */
import { Lead, LeadStatus } from '@/generated/prisma';
export interface CreateLeadData {
  name: string;
  email: string;
  phoneNumber?: string;
  destination: string;
  origin: string;
  weight: number;
  assignedToId?: string;
  country?: string; // Optional since it will be set by the API based on admin's country
}
export interface UpdateLeadData {
  name?: string;
  email?: string;
  phoneNumber?: string;
  destination?: string;
  origin?: string;
  weight?: number;
  status?: LeadStatus;
  assignedToId?: string;
}
export interface LeadFilters {
  status?: LeadStatus;
  assignedToId?: string;
  destination?: string;
  origin?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  weightMin?: number;
  weightMax?: number;
}
export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  shipped: number;
  failed: number;
  conversionRate: number;
}
export interface LeadWithDetails extends Lead {
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}
export type SortField = 'name' | 'email' | 'createdAt' | 'updatedAt' | 'weight' | 'status';
export type SortOrder = 'asc' | 'desc';
export interface LeadSort {
  field: SortField;
  order: SortOrder;
}
