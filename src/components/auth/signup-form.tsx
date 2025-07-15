/** @format */

'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Icons } from '../sidebar/icons';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'India',
    phoneNumber: '',
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Real-time validation
  useEffect(() => {
    const errors: { [key: string]: string } = {};

    // Name validation
    if (touched.name && formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (touched.email && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (touched.password && formData.password) {
      if (formData.password.length < 12) {
        errors.password = 'Password must be at least 12 characters';
      } else if (
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)
      ) {
        errors.password =
          'Password must contain uppercase, lowercase, number, and special character';
      }
    }

    // Confirm password validation
    if (touched.confirmPassword && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    // Phone number validation
    if (touched.phoneNumber && formData.phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        errors.phoneNumber = 'Please enter a valid phone number with country code (e.g., +919876543210)';
      }
    }

    setValidationErrors(errors);
  }, [formData, touched]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password === formData.confirmPassword &&
      formData.agreeToTerms &&
      formData.phoneNumber.trim() &&
      formData.country &&
      Object.keys(validationErrors).length === 0
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setPending(true);
    
    try {
      const { error: authError } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      toast.success('Account created successfully');
      router.push('/signin');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <section className='flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent'>
      <form
        onSubmit={handleSubmit}
        className='bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]'>
        <div className='bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6'>
          <div className='text-center'>
            <Link href='/' aria-label='go home' className='mx-auto block w-fit'>
              <Icons.logo />
            </Link>
            <h1 className='text-title mb-1 mt-4 text-xl font-semibold'>
              Create a Tailark Account
            </h1>
            <p className='text-sm'>Welcome! Create an account to get started</p>
          </div>

          <div className='mt-6 space-y-4'>
            {/* Name Field */}
            <div className='space-y-2'>
              <Label htmlFor='name' className='block text-sm'>
                Full Name
              </Label>
              <Input
                type='text'
                required
                name='name'
                id='name'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={cn(
                  'input sz-md variant-mixed',
                  validationErrors.name ? 'border-red-500' : ''
                )}
                placeholder='Enter your full name'
              />
              {validationErrors.name && (
                <p className='text-red-500 text-xs mt-1'>
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className='space-y-2'>
              <Label htmlFor='email' className='block text-sm'>
                Email
              </Label>
              <Input
                type='email'
                required
                name='email'
                id='email'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={cn(
                  'input sz-md variant-mixed',
                  validationErrors.email ? 'border-red-500' : ''
                )}
                placeholder='Enter your email address'
              />
              {validationErrors.email && (
                <p className='text-red-500 text-xs mt-1'>
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='block text-sm'>
                Password
              </Label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  name='password'
                  id='password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  onBlur={() => handleBlur('password')}
                  className={cn(
                    'input sz-md variant-mixed pr-10',
                    validationErrors.password ? 'border-red-500' : ''
                  )}
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>

              {validationErrors.password && (
                <p className='text-red-500 text-xs mt-1'>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='block text-sm'>
                Confirm Password
              </Label>
              <div className='relative'>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  name='confirmPassword'
                  id='confirmPassword'
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  onBlur={() => handleBlur('confirmPassword')}
                  className={cn(
                    'input sz-md variant-mixed pr-10',
                    validationErrors.confirmPassword ? 'border-red-500' : ''
                  )}
                  placeholder='Confirm your password'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }>
                  {showConfirmPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>

              {validationErrors.confirmPassword && (
                <p className='text-red-500 text-xs mt-1'>
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Phone Number Field */}
            <div className='space-y-2'>
              <Label htmlFor='phoneNumber' className='block text-sm'>
                Phone Number
              </Label>
              <Input
                type='tel'
                required
                name='phoneNumber'
                id='phoneNumber'
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                onBlur={() => handleBlur('phoneNumber')}
                className={cn(
                  'input sz-md variant-mixed',
                  validationErrors.phoneNumber ? 'border-red-500' : ''
                )}
                placeholder={formData.country === 'India' ? '+91 9876543210' : '+94 771234567'}
              />
              {validationErrors.phoneNumber && (
                <p className='text-red-500 text-xs mt-1'>
                  {validationErrors.phoneNumber}
                </p>
              )}
            </div>

            {/* Country Selection Field */}
            <div className='space-y-2'>
              <Label htmlFor='country' className='block text-sm'>
                Country
              </Label>
              <select
                name='country'
                id='country'
                required
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                onBlur={() => handleBlur('country')}
                className={cn(
                  'input sz-md variant-mixed',
                  validationErrors.country ? 'border-red-500' : ''
                )}
              >
                <option value='India'>India</option>
                <option value='Sri Lanka'>Sri Lanka</option>
              </select>
              {validationErrors.country && (
                <p className='text-red-500 text-xs mt-1'>
                  {validationErrors.country}
                </p>
              )}
            </div>
            <div className='flex items-start space-x-2'>
              <input
                type='checkbox'
                id='agreeToTerms'
                name='agreeToTerms'
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  handleInputChange('agreeToTerms', e.target.checked)
                }
                onBlur={() => handleBlur('agreeToTerms')}
                className='mt-1'
              />
              <label htmlFor='agreeToTerms' className='text-sm text-gray-700'>
                I agree to the{' '}
                <a
                  href='/terms'
                  target='_blank'
                  className='text-blue-600 hover:text-blue-800 hover:underline'>
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href='/privacy'
                  target='_blank'
                  className='text-blue-600 hover:text-blue-800 hover:underline'>
                  Privacy Policy
                </a>
              </label>
            </div>
            {touched.agreeToTerms && !formData.agreeToTerms && (
              <p className='text-red-500 text-xs mt-1'>
                You must agree to the terms and conditions
              </p>
            )}

            {/* Error Message Display */}
            {validationErrors.name && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                {validationErrors.name}
              </div>
            )}
            {validationErrors.email && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                {validationErrors.email}
              </div>
            )}
            {validationErrors.password && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                {validationErrors.password}
              </div>
            )}
            {validationErrors.confirmPassword && (
              <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'>
                {validationErrors.confirmPassword}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={!isFormValid() || pending}
              aria-disabled={!isFormValid() || pending}>
              {pending ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>

          <div className='my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3'>
            <hr className='border-dashed' />
            <span className='text-muted-foreground text-xs'>
              Or continue With
            </span>
            <hr className='border-dashed' />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <Button type='button' variant='outline'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='0.98em'
                height='1em'
                viewBox='0 0 256 262'>
                <path
                  fill='#4285f4'
                  d='M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027'></path>
                <path
                  fill='#34a853'
                  d='M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1'></path>
                <path
                  fill='#fbbc05'
                  d='M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z'></path>
                <path
                  fill='#eb4335'
                  d='M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251'></path>
              </svg>
              <span>Google</span>
            </Button>
            <Button type='button' variant='outline'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='1em'
                height='1em'
                viewBox='0 0 256 256'>
                <path fill='#f1511b' d='M121.666 121.666H0V0h121.666z'></path>
                <path fill='#80cc28' d='M256 121.666H134.335V0H256z'></path>
                <path
                  fill='#00adef'
                  d='M121.663 256.002H0V134.336h121.663z'></path>
                <path
                  fill='#fbbc09'
                  d='M256 256.002H134.335V134.336H256z'></path>
              </svg>
              <span>Microsoft</span>
            </Button>
          </div>
        </div>

        <div className='p-3'>
          <p className='text-accent-foreground text-center text-sm'>
            Have an account ?
            <Button asChild variant='link' className='px-2'>
              <Link href='/signin'>Sign In</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
