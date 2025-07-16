/** @format */
'use client';
import React from 'react';
import { useLeadStore } from '@/store/lead-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { LeadWithDetails } from '@/types/lead';
interface DeleteLeadDialogProps {
  open: boolean;
  onClose: () => void;
  lead: LeadWithDetails | null;
}
export default function DeleteLeadDialog({ open, onClose, lead }: DeleteLeadDialogProps) {
  const { deleteLead, isLoading } = useLeadStore();
  const handleDelete = async () => {
    if (!lead) return;
    try {
      await deleteLead(lead.id);
      onClose();
    } catch (error) {
      }
  };
  if (!lead) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Lead
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this lead? This action cannot be undone.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{lead.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Email:</span>
                <span>{lead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span className="capitalize">{lead.status.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Created:</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm font-medium">
              ⚠️ Warning: This will permanently remove all lead data including history and cannot be recovered.
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Lead'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
