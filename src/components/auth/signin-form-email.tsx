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
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';

export default function SigninFormWithEmail() {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.email.trim() && formData.password.trim();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setPending(true);

    try {
      const { error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Signed in successfully');
      router.push(callbackUrl);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Invalid credentials');
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
              Sign in to Kajen Traders
            </h1>
            <p className='text-sm'>Welcome back! Please sign in to continue</p>
          </div>

          <div className='mt-6 space-y-4'>
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

            <div className='text-right'>
              <Link
                href='/forgot-password'
                className='text-sm text-primary hover:underline'>
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={!isFormValid() || pending}>
              {pending ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-muted-foreground'>
              Don't have an account?{' '}
              <Link href='/signup' className='text-primary hover:underline'>
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </form>
    </section>
  );
}

