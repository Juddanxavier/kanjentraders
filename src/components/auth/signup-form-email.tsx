/** @format */

'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Icons } from '../sidebar/icons';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';

export default function SignupFormWithEmail() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.password === formData.confirmPassword &&
      formData.agreeToTerms
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setPending(true);

    try {
      const { error } = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (error) {
        throw new Error(error.message);
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
              Create a Kajen Traders Account
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
                className='input sz-md variant-mixed'
                placeholder='Enter your full name'
              />
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
                className='input sz-md variant-mixed'
                placeholder='Enter your email address'
              />
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
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className='input sz-md variant-mixed pr-10'
                  placeholder='Enter your password'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
                  onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
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
                  className='input sz-md variant-mixed pr-10'
                  placeholder='Confirm your password'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff className='h-5 w-5' />
                  ) : (
                    <Eye className='h-5 w-5' />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className='flex items-start space-x-2'>
              <input
                type='checkbox'
                id='agreeToTerms'
                name='agreeToTerms'
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  handleInputChange('agreeToTerms', e.target.checked)
                }
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

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={!isFormValid() || pending}>
              {pending ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-muted-foreground'>
              Already have an account?{' '}
              <Link href='/signin' className='text-primary hover:underline'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </form>
    </section>
  );
}

