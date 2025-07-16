/** @format */
'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLeadStore } from '@/store/lead-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Loader2, X } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CreateLeadData } from '@/types/lead';
import type { AuthUser } from '@/lib/auth/permissions';
import { toast } from 'sonner';
const createLeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().optional(),
  destination: z.string().min(2, 'Destination is required'),
  origin: z.string().min(2, 'Origin is required'),
  weight: z.number().min(0.1, 'Weight must be greater than 0'),
  assignedToId: z.string().min(1, 'Please assign this lead to a user'),
});
type CreateLeadFormData = z.infer<typeof createLeadSchema>;
interface CreateLeadFormProps {
  open: boolean;
  onClose: () => void;
}
const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China',
  'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'India', 'Indonesia', 'Ireland', 'Italy',
  'Japan', 'Malaysia', 'Netherlands', 'New Zealand', 'Norway', 'Pakistan', 'Philippines', 'Singapore', 'South Korea',
  'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'United Kingdom', 'United States', 'Vietnam'
];
export default function CreateLeadForm({ open, onClose }: CreateLeadFormProps) {
  const { createLead, isLoading } = useLeadStore();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [step, setStep] = useState(1);
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('Failed to fetch users. Please try again.');
      } finally {
        setLoadingUsers(false);
      }
    };
    if (open) {
      fetchUsers();
    }
  }, [open]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      destination: '',
      origin: '',
      weight: 0,
      assignedToId: '',
    },
  });
  const onSubmit = async (data: CreateLeadFormData) => {
    try {
      await createLead({
        ...data,
        weight: Number(data.weight),
        assignedToId: data.assignedToId,
      });
      toast.success('Lead created successfully!');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to create lead. Please try again.');
      console.error('Error creating lead:', error);
    }
  };
  const handleClose = () => {
    reset();
    onClose();
  };
  // Watch for assigned user changes to auto-fill
  const watchedAssignedToId = watch('assignedToId');
  // Auto-fill form when user is selected
  useEffect(() => {
    if (watchedAssignedToId) {
      const selectedUser = users.find(user => user.id === watchedAssignedToId);
      if (selectedUser) {
        setValue('name', selectedUser.name || '');
        setValue('email', selectedUser.email);
        setValue('phoneNumber', selectedUser.phoneNumber || '');
      }
    }
  }, [watchedAssignedToId, users, setValue]);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  // Reset step and form when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      reset();
    }
  }, [open, reset]);
  const selectedUser = users.find(user => user.id === watchedAssignedToId);
  const handleNextStep = () => {
    if (!watchedAssignedToId) {
      return;
    }
    setStep(2);
  };
  const LeadForm = () => {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium">Step 1: Select User</h3>
            <p className="text-sm text-muted-foreground mt-1">Choose who this lead will be assigned to</p>
          </div>
          <div className="space-y-2">
            <Label>Assign to User *</Label>
            <Popover open={userSelectOpen} onOpenChange={setUserSelectOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSelectOpen}
                  className={`w-full justify-between ${errors.assignedToId ? 'border-red-500' : ''}`}
                  disabled={loadingUsers}
                >
                  {selectedUser ? (
                    <div className="flex items-center space-x-2">
                      <span>{selectedUser.name || 'No name'}</span>
                      <span className="text-muted-foreground text-sm">({selectedUser.email})</span>
                    </div>
                  ) : (
                    loadingUsers ? 'Loading users...' : 'Search and select user...'
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search users by name or email..." />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={`${user.name} ${user.email}`}
                          onSelect={() => {
                            setValue('assignedToId', user.id);
                            setUserSelectOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              watchedAssignedToId === user.id ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name || 'No name'}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.assignedToId && <p className="text-red-500 text-sm">{errors.assignedToId.message}</p>}
          </div>
          {selectedUser && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Selected User Details:</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {selectedUser.name || 'No name'}</p>
                <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                <p><span className="font-medium">Phone:</span> {selectedUser.phoneNumber || 'No phone'}</p>
                <p><span className="font-medium">Country:</span> {selectedUser.country}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="button" onClick={handleNextStep} disabled={!watchedAssignedToId}>
              Next: Lead Details
            </Button>
          </div>
        </div>
      );
    }
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium">Step 2: Lead Details</h3>
          <p className="text-sm text-muted-foreground mt-1">Fill in the lead information</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input 
              id="name" 
              {...register('name')} 
              placeholder="Enter full name" 
              className={errors.name ? 'border-red-500' : ''} 
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              {...register('email')} 
              placeholder="Enter email address" 
              className={errors.email ? 'border-red-500' : ''} 
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input 
              id="phoneNumber" 
              {...register('phoneNumber')} 
              placeholder="Enter phone number" 
            />
          </div>
          {/* Weight Field */}
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input 
              id="weight" 
              type="number" 
              step="0.1" 
              {...register('weight', { valueAsNumber: true })} 
              placeholder="Enter weight in kg" 
              className={errors.weight ? 'border-red-500' : ''} 
            />
            {errors.weight && <p className="text-red-500 text-sm">{errors.weight.message}</p>}
          </div>
          {/* Origin Field */}
          <div className="space-y-2">
            <Label htmlFor="origin">Origin Country *</Label>
            <Select onValueChange={(value) => setValue('origin', value)}>
              <SelectTrigger className={errors.origin ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select origin country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
              </SelectContent>
            </Select>
            {errors.origin && <p className="text-red-500 text-sm">{errors.origin.message}</p>}
          </div>
          {/* Destination Field */}
          <div className="space-y-2">
            <Label htmlFor="destination">Destination Country *</Label>
            <Select onValueChange={(value) => setValue('destination', value)}>
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
        </div>
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </div>
        </div>
      </form>
    );
  };
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogPortal>
          <DialogOverlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
          <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                {step === 1 ? 'Select a user to assign this lead to' : 'Fill in the lead details below'}
              </DialogDescription>
            </DialogHeader>
            <LeadForm />
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );
  }
  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Create New Lead</DrawerTitle>
          <DrawerDescription>
            Fill in the details below and click save.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <LeadForm />
        </div>
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
