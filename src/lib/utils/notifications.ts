/** @format */

import { NotificationService } from '@/lib/services/notificationService';
import { NotificationType } from '@/generated/prisma';

/**
 * Send a welcome notification to a new user
 */
export async function sendWelcomeNotification(userId: string) {
  return NotificationService.createFromTemplate(
    userId,
    'USER_WELCOME',
    { timestamp: new Date() },
    {
      message: 'Welcome to Kajen Traders! We\'re excited to have you on board.',
      actionUrl: '/dashboard',
    }
  );
}

/**
 * Send a shipment status update notification
 */
export async function sendShipmentStatusNotification(
  userId: string,
  shipmentData: {
    id: string;
    trackingNumber: string;
    status: string;
    whiteLabelTrackingId: string;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'SHIPMENT_STATUS_UPDATE',
    {
      shipmentId: shipmentData.id,
      trackingNumber: shipmentData.trackingNumber,
      status: shipmentData.status,
    },
    {
      title: 'Shipment Status Updated',
      message: `Your shipment ${shipmentData.whiteLabelTrackingId} is now ${shipmentData.status.toLowerCase()}`,
      actionUrl: `/shipments/${shipmentData.id}`,
    }
  );
}

/**
 * Send a shipment delivered notification
 */
export async function sendShipmentDeliveredNotification(
  userId: string,
  shipmentData: {
    id: string;
    trackingNumber: string;
    whiteLabelTrackingId: string;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'SHIPMENT_DELIVERED',
    {
      shipmentId: shipmentData.id,
      trackingNumber: shipmentData.trackingNumber,
    },
    {
      title: 'Package Delivered!',
      message: `Your package ${shipmentData.whiteLabelTrackingId} has been successfully delivered`,
      actionUrl: `/shipments/${shipmentData.id}`,
      priority: 2, // High priority
    }
  );
}

/**
 * Send a lead assigned notification
 */
export async function sendLeadAssignedNotification(
  userId: string,
  leadData: {
    id: string;
    name: string;
    email: string;
    destination: string;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'LEAD_ASSIGNED',
    {
      leadId: leadData.id,
      customerName: leadData.name,
      destination: leadData.destination,
    },
    {
      title: 'New Lead Assigned',
      message: `You have been assigned a new lead: ${leadData.name} (${leadData.email})`,
      actionUrl: `/leads/${leadData.id}`,
    }
  );
}

/**
 * Send a lead converted notification
 */
export async function sendLeadConvertedNotification(
  userId: string,
  leadData: {
    id: string;
    name: string;
    shipmentId: string;
    whiteLabelTrackingId: string;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'LEAD_CONVERTED',
    {
      leadId: leadData.id,
      shipmentId: leadData.shipmentId,
      trackingId: leadData.whiteLabelTrackingId,
    },
    {
      title: 'Lead Converted to Shipment',
      message: `Lead ${leadData.name} has been converted to shipment ${leadData.whiteLabelTrackingId}`,
      actionUrl: `/shipments/${leadData.shipmentId}`,
    }
  );
}

/**
 * Send a system maintenance notification to all users
 */
export async function sendMaintenanceNotification(
  userIds: string[],
  maintenanceData: {
    startTime: Date;
    endTime: Date;
    description: string;
  }
) {
  return NotificationService.createBulk(
    userIds,
    'SYSTEM_MAINTENANCE',
    {
      startTime: maintenanceData.startTime,
      endTime: maintenanceData.endTime,
    },
    {
      title: 'Scheduled Maintenance',
      message: `${maintenanceData.description}. Expected downtime: ${maintenanceData.startTime.toLocaleTimeString()} - ${maintenanceData.endTime.toLocaleTimeString()}`,
      priority: 2, // High priority
      expiresAt: new Date(maintenanceData.endTime.getTime() + 24 * 60 * 60 * 1000), // Expire 24 hours after maintenance
    }
  );
}

/**
 * Send a role change notification
 */
export async function sendRoleChangeNotification(
  userId: string,
  roleData: {
    oldRole: string;
    newRole: string;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'USER_ROLE_CHANGE',
    {
      oldRole: roleData.oldRole,
      newRole: roleData.newRole,
    },
    {
      title: 'Account Role Updated',
      message: `Your account role has been changed from ${roleData.oldRole} to ${roleData.newRole}`,
      actionUrl: '/profile',
    }
  );
}

/**
 * Send account locked notification
 */
export async function sendAccountLockedNotification(
  userId: string,
  lockData: {
    reason: string;
    expires?: Date;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'USER_ACCOUNT_LOCKED',
    {
      reason: lockData.reason,
      expires: lockData.expires,
    },
    {
      title: 'Account Locked',
      message: `Your account has been locked. Reason: ${lockData.reason}${lockData.expires ? ` Expires: ${lockData.expires.toLocaleString()}` : ''}`,
      priority: 3, // Urgent
    }
  );
}

/**
 * Send a shipment exception notification
 */
export async function sendShipmentExceptionNotification(
  userId: string,
  shipmentData: {
    id: string;
    trackingNumber: string;
    whiteLabelTrackingId: string;
    issue: string;
  }
) {
  return NotificationService.createFromTemplate(
    userId,
    'SHIPMENT_EXCEPTION',
    {
      shipmentId: shipmentData.id,
      trackingNumber: shipmentData.trackingNumber,
      issue: shipmentData.issue,
    },
    {
      title: 'Delivery Exception',
      message: `Issue with shipment ${shipmentData.whiteLabelTrackingId}: ${shipmentData.issue}`,
      actionUrl: `/shipments/${shipmentData.id}`,
      priority: 2, // High priority
    }
  );
}
