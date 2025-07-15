/** @format */

'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLeadStore } from '@/store/lead-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Loader2, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';
import { LeadWithDetails, UpdateLeadData } from '@/types/lead';
import { LeadStatus } from '@/generated/prisma';

const editLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  destination: z.string().min(2, 'Destination is required'),
  origin: z.string().min(2, 'Origin is required'),
  weight: z.number().min(0.1, 'Weight must be greater than 0'),
  status: z.enum(['NEW', 'CONTACTED', 'SHIPPED', 'FAILED']),
  assignedToId: z.string().optional(),
});

type EditLeadFormData = z.infer<typeof editLeadSchema>;

interface EditLeadFormProps {
  open: boolean;
  onClose: () => void;
  lead: LeadWithDetails | null;
}

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China',
  'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'India', 'Indonesia', 'Ireland', 'Italy',
  'Japan', 'Malaysia', 'Netherlands', 'New Zealand', 'Norway', 'Pakistan', 'Philippines', 'Singapore', 'South Korea',
  'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'United Kingdom', 'United States', 'Vietnam'
];

const statusOptions = [
  { value: 'NEW', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONTACTED', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-green-100 text-green-800' },
  { value: 'FAILED', label: 'Failed', color: 'bg-red-100 text-red-800' },
];

export default function EditLeadForm({ open, onClose, lead }: EditLeadFormProps) {
  const { updateLead, isLoading } = useLeadStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<EditLeadFormData>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      destination: '',
      origin: '',
      weight: 0,
      status: 'NEW',
      assignedToId: '',
    },
  });

  // Pre-populate form when lead changes
  useEffect(() => {
    if (lead) {
      setValue('name', lead.name);
      setValue('email', lead.email);
      setValue('phoneNumber', lead.phoneNumber || '');
      setValue('destination', lead.destination);
      setValue('origin', lead.origin);
      setValue('weight', lead.weight);
      setValue('status', lead.status);
      setValue('assignedToId', lead.assignedToId || '');
    }
  }, [lead, setValue]);

  const onSubmit = async (data: EditLeadFormData) => {
    if (!lead) return;

    try {
      await updateLead(lead.id, {
        ...data,
        weight: Number(data.weight),
        assignedToId: data.assignedToId || undefined,
      });
      toast.success('Lead updated successfully!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to update lead. Please try again.');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!lead) return null;

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the details below and click save.
            </DialogDescription>
          </DialogHeader>
          <ProfileForm onSubmit={handleSubmit(onSubmit)} errors={errors} lead={lead} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Lead</DrawerTitle>
          <DrawerDescription>
            Update the details below and click save.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <ProfileForm onSubmit={handleSubmit(onSubmit)} errors={errors} lead={lead} />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  function ProfileForm({ onSubmit, errors, lead }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} placeholder="Enter full name" className={errors.name ? 'border-red-500' : ''} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="Enter email address" className={errors.email ? 'border-red-500' : ''} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" {...register('phoneNumber')} placeholder="Enter phone number" />
          </div>

          {/* Weight Field */}
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input id="weight" type="number" step="0.1" {...register('weight', { valueAsNumber: true })} placeholder="Enter weight in kg" className={errors.weight ? 'border-red-500' : ''} />
            {errors.weight && <p className="text-red-500 text-sm">{errors.weight.message}</p>}
          </div>

          {/* Origin Field */}
          <div className="space-y-2">
            <Label htmlFor="origin">Origin Country *</Label>
            <Select value={watch('origin')} onValueChange={(value) => setValue('origin', value)}>
              <SelectTrigger className={errors.origin ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select origin country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.origin && <p className="text-red-500 text-sm">{errors.origin.message}</p>}
          </div>

          {/* Destination Field */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination Country *</Label>
            <Select value={watch('destination')} onValueChange={(value) => setValue('destination', value)}>
              <SelectTrigger className={errors.destination ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select destination country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination && <p className="text-red-500 text-sm">{errors.destination.message}</p>}
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={watch('status')} onValueChange={(value) => setValue('status', value as LeadStatus)}>
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          {/* Assigned To Field - Placeholder for future implementation */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Input id="assignedTo" {...register('assignedToId')} placeholder="Admin ID (optional)" />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Lead Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span> {new Date(lead.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {new Date(lead.updatedAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Created By:</span> {lead.createdBy?.name || 'Unknown'}
            </div>
            <div>
              <span className="font-medium">Assigned To:</span> {lead.assignedTo?.name || 'Unassigned'}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>) : ('Update Lead')}</Button>
        </div>
      </form>
    );
  }
}
