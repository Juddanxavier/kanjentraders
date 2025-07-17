/** @format */

// Available countries in the system
export const COUNTRIES = {
  INDIA: 'India',
  SRI_LANKA: 'Sri Lanka',
} as const;

// Country list for dropdowns and selects
export const COUNTRY_LIST = [
  { value: COUNTRIES.INDIA, label: 'India', code: 'IN', flag: '🇮🇳' },
  { value: COUNTRIES.SRI_LANKA, label: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
] as const;

// Default country
export const DEFAULT_COUNTRY = COUNTRIES.INDIA;

// Country type
export type Country = typeof COUNTRIES[keyof typeof COUNTRIES];

// Helper function to get country display info
export function getCountryInfo(country: string) {
  return COUNTRY_LIST.find(c => c.value === country) || {
    value: country,
    label: country,
    code: country.slice(0, 2).toUpperCase(),
    flag: '🏴'
  };
}

// Helper function to validate country
export function isValidCountry(country: string): country is Country {
  return Object.values(COUNTRIES).includes(country as Country);
}
