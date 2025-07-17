/** @format */
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ViewUserTabsProps {
  user: any;
  currentUser: any;
  createdLeadShipments: any[];
  assignedLeadShipments: any[];
}

export function ViewUserTabs({
  user,
  currentUser,
  createdLeadShipments,
  assignedLeadShipments,
}: ViewUserTabsProps) {
  return (
    <Tabs defaultValue="details" className="mt-6">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="shipments">Shipments</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">User Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Email:</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="font-medium">Name:</p>
              <p className="text-muted-foreground">{user.name || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Role:</p>
              <p className="text-muted-foreground">{user.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="font-medium">Country:</p>
              <p className="text-muted-foreground">{user.country}</p>
            </div>
            <div>
              <p className="font-medium">Status:</p>
              <p className="text-muted-foreground">{user.banned ? 'Banned' : 'Active'}</p>
            </div>
            <div>
              <p className="font-medium">Email Verified:</p>
              <p className="text-muted-foreground">{user.emailVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-medium">Phone:</p>
              <p className="text-muted-foreground">{user.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Phone Verified:</p>
              <p className="text-muted-foreground">{user.phoneNumberVerified ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-medium">Created At:</p>
              <p className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-medium">Last Login:</p>
              <p className="text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="leads">
        <div>
          <h2 className="text-xl font-semibold">Leads</h2>
          <p>Assigned Leads:</p>
          {user.assignedLeads?.length ? user.assignedLeads.map((lead: any) => (
            <div key={lead.id}>
              <p>Lead: {lead.name} ({lead.email})</p>
              <p>Status: {lead.status}</p>
            </div>
          )) : (
            <p className="text-muted-foreground">No assigned leads found</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="shipments">
        <div>
          <h2 className="text-xl font-semibold">Shipments</h2>
          <p>Created Lead Shipments:</p>
          {createdLeadShipments.length ? createdLeadShipments.map((shipment) => (
            <div key={shipment.id}>
              <p>Details: {shipment.trackingNumber} ({shipment.status})</p>
              <p>Carrier: {shipment.carrier}, Estimated Delivery: {shipment.estimatedDelivery}</p>
            </div>
          )) : (
            <p className="text-muted-foreground">No created shipments found</p>
          )}
          <p>Assigned Lead Shipments:</p>
          {assignedLeadShipments.length ? assignedLeadShipments.map((shipment) => (
            <div key={shipment.id}>
              <p>Details: {shipment.trackingNumber} ({shipment.status})</p>
              <p>Carrier: {shipment.carrier}, Estimated Delivery: {shipment.estimatedDelivery}</p>
            </div>
          )) : (
            <p className="text-muted-foreground">No assigned shipments found</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

