/** @format */

import { NotificationType } from '@/generated/prisma';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  readAt?: Date | null;
  actionUrl?: string | null;
  priority: number;
  createdAt: Date;
  expiresAt?: Date | null;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  priority?: number;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  priority?: number;
  expiresAt?: Date;
}

export const NOTIFICATION_PRIORITIES = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
} as const;

export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  SYSTEM_MAINTENANCE: {
    type: 'SYSTEM_MAINTENANCE',
    title: 'System Maintenance',
    message: 'Scheduled maintenance in progress',
    priority: NOTIFICATION_PRIORITIES.HIGH,
  },
  SYSTEM_FEATURE: {
    type: 'SYSTEM_FEATURE',
    title: 'New Feature Available',
    message: 'Check out our latest feature',
    priority: NOTIFICATION_PRIORITIES.LOW,
  },
  SYSTEM_SECURITY: {
    type: 'SYSTEM_SECURITY',
    title: 'Security Alert',
    message: 'Please review your account security',
    priority: NOTIFICATION_PRIORITIES.URGENT,
  },
  SHIPMENT_CREATED: {
    type: 'SHIPMENT_CREATED',
    title: 'New Shipment Created',
    message: 'A new shipment has been created',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  SHIPMENT_STATUS_UPDATE: {
    type: 'SHIPMENT_STATUS_UPDATE',
    title: 'Shipment Status Update',
    message: 'Your shipment status has been updated',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  SHIPMENT_DELIVERED: {
    type: 'SHIPMENT_DELIVERED',
    title: 'Package Delivered',
    message: 'Your package has been delivered',
    priority: NOTIFICATION_PRIORITIES.HIGH,
  },
  SHIPMENT_EXCEPTION: {
    type: 'SHIPMENT_EXCEPTION',
    title: 'Delivery Exception',
    message: 'There was an issue with your delivery',
    priority: NOTIFICATION_PRIORITIES.HIGH,
  },
  LEAD_ASSIGNED: {
    type: 'LEAD_ASSIGNED',
    title: 'New Lead Assigned',
    message: 'A new lead has been assigned to you',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  LEAD_STATUS_CHANGE: {
    type: 'LEAD_STATUS_CHANGE',
    title: 'Lead Status Updated',
    message: 'Lead status has been changed',
    priority: NOTIFICATION_PRIORITIES.LOW,
  },
  LEAD_CONVERTED: {
    type: 'LEAD_CONVERTED',
    title: 'Lead Converted',
    message: 'Lead has been converted to shipment',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  USER_WELCOME: {
    type: 'USER_WELCOME',
    title: 'Welcome to Kajen Traders',
    message: 'Welcome to our parcel tracking platform',
    priority: NOTIFICATION_PRIORITIES.LOW,
  },
  USER_ROLE_CHANGE: {
    type: 'USER_ROLE_CHANGE',
    title: 'Role Updated',
    message: 'Your account role has been updated',
    priority: NOTIFICATION_PRIORITIES.MEDIUM,
  },
  USER_ACCOUNT_LOCKED: {
    type: 'USER_ACCOUNT_LOCKED',
    title: 'Account Locked',
    message: 'Your account has been locked',
    priority: NOTIFICATION_PRIORITIES.URGENT,
  },
};
