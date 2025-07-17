/** @format */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { COUNTRY_LIST, getCountryInfo } from '@/lib/constants/countries';
import type { AuthUser } from '@/lib/auth/permissions';
import { Globe, ChevronDown } from 'lucide-react';

interface CountrySelectorProps {
  user: AuthUser;
  selectedCountry?: string;
  onCountryChange?: (country: string) => void;
  className?: string;
}

export function CountrySelector({
  user,
  selectedCountry,
  onCountryChange,
  className = '',
}: CountrySelectorProps) {
  const [currentCountry, setCurrentCountry] = useState(selectedCountry || user.country || 'India');
  const router = useRouter();

  // Only show country selector for super admins
  if (user.role !== 'super_admin') {
    const countryInfo = getCountryInfo(user.country || 'India');
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="gap-1">
          <span>{countryInfo.flag}</span>
          {countryInfo.label}
        </Badge>
      </div>
    );
  }

  const handleCountryChange = (country: string) => {
    setCurrentCountry(country);
    if (onCountryChange) {
      onCountryChange(country);
    }
    
    // Store the selected country in session storage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_selected_country', country);
    }
  };

  // Load saved country from session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCountry = sessionStorage.getItem('admin_selected_country');
      if (savedCountry && savedCountry !== currentCountry) {
        setCurrentCountry(savedCountry);
        if (onCountryChange) {
          onCountryChange(savedCountry);
        }
      }
    }
  }, [currentCountry, onCountryChange]);

  const currentCountryInfo = getCountryInfo(currentCountry);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-muted-foreground" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <span>{currentCountryInfo.flag}</span>
            {currentCountryInfo.label}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="p-2 text-xs text-muted-foreground border-b">
            Select Country Branch
          </div>
          {COUNTRY_LIST.map((country) => (
            <DropdownMenuItem
              key={country.value}
              onClick={() => handleCountryChange(country.value)}
              className={`gap-2 ${
                currentCountry === country.value ? 'bg-accent' : ''
              }`}
            >
              <span>{country.flag}</span>
              <span className="flex-1">{country.label}</span>
              {currentCountry === country.value && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Hook to use country selection in components
export function useCountrySelection(user: AuthUser) {
  const [selectedCountry, setSelectedCountry] = useState<string>(
    user.role === 'super_admin' ? 'India' : user.country || 'India'
  );

  useEffect(() => {
    if (user.role === 'super_admin' && typeof window !== 'undefined') {
      const savedCountry = sessionStorage.getItem('admin_selected_country');
      if (savedCountry) {
        setSelectedCountry(savedCountry);
      }
    }
  }, [user.role]);

  const changeCountry = (country: string) => {
    setSelectedCountry(country);
    if (user.role === 'super_admin' && typeof window !== 'undefined') {
      sessionStorage.setItem('admin_selected_country', country);
    }
  };

  return {
    selectedCountry,
    changeCountry,
    canChangeCountry: user.role === 'super_admin',
  };
}
