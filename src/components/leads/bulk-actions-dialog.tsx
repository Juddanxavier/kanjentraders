/** @format */
'use client';
import React, { useState } from 'react';
import { useLeadStore } from '@/store/lead-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Users, AlertTriangle } from 'lucide-react';
import { LeadStatus } from '@/generated/prisma';
import { toast } from 'sonner';
interface BulkActionsDialogProps {
  open: boolean;
  onClose: () => void;
  selectedLeads: string[];
  actionType: 'update' | 'delete' | null;
}
const statusOptions = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'FAILED', label: 'Failed' },
];
export default function BulkActionsDialog({ 
  open, 
  onClose, 
  selectedLeads, 
  actionType 
}: BulkActionsDialogProps) {
  const { bulkUpdateStatus, bulkDelete, isLoading } = useLeadStore();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | ''>('');
  const handleBulkUpdate = async () => {
    if (!selectedStatus) {
      return;
    }
    try {
      await bulkUpdateStatus(selectedLeads, selectedStatus);
      toast.success(`Successfully updated ${selectedLeads.length} lead(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to update leads. Please try again.');
      console.error('Error updating leads:', error);
    }
  };
  const handleBulkDelete = async () => {
    try {
      await bulkDelete(selectedLeads);
      toast.success(`Successfully deleted ${selectedLeads.length} lead(s)`);
      onClose();
    } catch (error) {
      toast.error('Failed to delete leads. Please try again.');
      console.error('Error deleting leads:', error);
    }
  };
  const handleClose = () => {
    setSelectedStatus('');
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {actionType === 'delete' ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Multiple Leads
              </>
            ) : (
              <>
                <Users className="h-5 w-5 text-blue-500" />
                Update Multiple Leads
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              You have selected <span className="font-medium">{selectedLeads.length}</span> lead(s) for{' '}
              {actionType === 'delete' ? 'deletion' : 'status update'}.
            </p>
          </div>
          {actionType === 'update' && (
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as LeadStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {actionType === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Warning: This will permanently delete all selected leads and cannot be undone.
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {actionType === 'update' && (
            <Button 
              type="button" 
              onClick={handleBulkUpdate}
              disabled={isLoading || !selectedStatus}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Update ${selectedLeads.length} Lead(s)`
              )}
            </Button>
          )}
          {actionType === 'delete' && (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedLeads.length} Lead(s)`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
