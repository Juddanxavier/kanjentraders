/** @format */
'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '../sidebar/icons';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { getClientSession, getRoleBasedRedirectPath } from '@/lib/services/sessionService.client';

export default function SigninForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();

  // Real-time validation
  const validate = (field: 'email' | 'password', value: string) => {
    let error = '';
    if (field === 'email') {
      if (!value.trim()) error = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        error = 'Please enter a valid email address';
    }
    if (field === 'password') {
      if (!value.trim()) error = 'Password is required';
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validate(field, value);
    setErrors((prev) => ({ ...prev, form: undefined }));
  };

  const isFormValid = () => {
    return (
      formData.email.trim() &&
      formData.password.trim() &&
      !errors.email &&
      !errors.password
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    validate('email', formData.email);
    validate('password', formData.password);
    if (!isFormValid()) return;
    setPending(true);
    setErrors((prev) => ({ ...prev, form: undefined }));
    try {
      const { error: authError } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });
      if (authError) {
        setErrors((prev) => ({ ...prev, form: authError.message }));
        toast.error(authError.message);
        return;
      }
      toast.success('Signed in successfully');

      // Get session and redirect based on role
      const sessionData = await getClientSession();
      const redirectPath = getRoleBasedRedirectPath(sessionData?.user.role || null);
      router.push(redirectPath);
    } catch {
      setErrors((prev) => ({ ...prev, form: 'An unexpected error occurred' }));
      toast.error('An unexpected error occurred');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className='flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent'>
      <form
        onSubmit={handleSubmit}
        className='bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]'
        noValidate
        aria-describedby={errors.form ? 'form-error' : undefined}>
        <div className='p-8 pb-6'>
          <div>
            <Link href='/' aria-label='go home'>
              <Icons.logo />
            </Link>
          </div>

          <div className='mt-6 grid grid-cols-2 gap-3'>
            <Button type='button' variant='outline'>
              <span>Google</span>
            </Button>
            <Button type='button' variant='outline'>
              <span>Microsoft</span>
            </Button>
          </div>

          <hr className='my-4 border-dashed' />

          <div className='space-y-6'>
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
                className={cn(
                  'input sz-md variant-mixed',
                  errors.email ? 'border-red-500' : ''
                )}
                placeholder='Enter your email address'
                autoComplete='email'
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p className='text-red-500 text-xs mt-1' id='email-error'>
                  {errors.email}
                </p>
              )}
            </div>

            <div className='space-y-0.5'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password' className='text-title text-sm'>
                  Password
                </Label>
                <Button asChild variant='link' size='sm'>
                  <Link
                    href='#'
                    className='link intent-info variant-ghost text-sm'>
                    Forgot your Password ?
                  </Link>
                </Button>
              </div>
              <Input
                type='password'
                required
                name='password'
                id='password'
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={cn(
                  'input sz-md variant-mixed',
                  errors.password ? 'border-red-500' : ''
                )}
                placeholder='Enter your password'
                autoComplete='current-password'
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
              />
              {errors.password && (
                <p className='text-red-500 text-xs mt-1' id='password-error'>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Error Message Display */}
            {errors.form && (
              <div
                className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded'
                id='form-error'>
                {errors.form}
              </div>
            )}

            <Button
              type='submit'
              className='w-full'
              disabled={pending}
              aria-disabled={pending}>
              {pending ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </div>
        <div className='bg-muted rounded-(--radius) border p-3'>
          <p className='text-accent-foreground text-center text-sm'>
            Don&apos;t have an account ?
            <Button asChild variant='link' className='px-2'>
              <Link href='#'>Create account</Link>
            </Button>
          </p>
        </div>
      </form>
    </section>
  );
}
