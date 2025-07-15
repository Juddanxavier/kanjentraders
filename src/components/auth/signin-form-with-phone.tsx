/** @format */

'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Icons } from '../sidebar/icons';
import { useState } from 'react';
import { Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { getClientSession, getRoleBasedRedirectPath } from '@/lib/services/sessionService.client';

export default function SigninFormWithPhone() {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState<'signin' | 'verify-otp'>('signin');
  const [otpCode, setOtpCode] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    if (authMethod === 'email') {
      return formData.email.trim() && formData.password.trim();
    } else {
      return formData.phoneNumber.trim();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setPending(true);

    try {
      if (authMethod === 'email') {
        // Email + Password signin
        const { data, error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success('Signed in successfully');
        
        // Get session and redirect based on role
        const sessionData = await getClientSession();
        const redirectPath = getRoleBasedRedirectPath(sessionData?.user.role || null);
        router.push(redirectPath);
      } else {
        // Phone + OTP signin - Step 1: Send OTP
        console.log('Sending OTP to:', formData.phoneNumber);
        
        const { error } = await authClient.phoneNumber.sendOtp({
          phoneNumber: formData.phoneNumber,
        });
        
        if (error) {
          console.error('Error sending OTP:', error);
          throw new Error(error.message);
        }
        
        toast.success('OTP sent to your phone');
        setStep('verify-otp');
      }
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

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setPending(true);

    try {
      // Verify OTP for existing users only
      console.log('Verifying OTP for:', formData.phoneNumber);
      
      const { data, error } = await authClient.phoneNumber.verify({
        phoneNumber: formData.phoneNumber,
        code: otpCode,
      });

      console.log('Verification response:', { data, error });

      if (error) {
        // Check if error is because user doesn't exist
        if (error.message?.toLowerCase().includes('user not found') || 
            error.message?.toLowerCase().includes('not found') ||
            error.code === 'USER_NOT_FOUND') {
          toast.error('No account found. Redirecting to sign up...');
          router.push(`/signup?phone=${encodeURIComponent(formData.phoneNumber)}`);
          return;
        }
        throw new Error(error.message);
      }

      // If verification successful but no data, something went wrong
      if (!data) {
        throw new Error('Verification failed. Please try again.');
      }

      toast.success('Signed in successfully');
      
      // Refresh the router to ensure the new session is recognized
      router.refresh();
      
      // Get session and redirect based on role
      const sessionData = await getClientSession();
      const redirectPath = getRoleBasedRedirectPath(sessionData?.user.role || null);
      router.push(redirectPath);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Invalid OTP');
      }
    } finally {
      setPending(false);
    }
  };

  if (step === 'verify-otp') {
    return (
      <section className='flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent'>
        <div className='bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]'>
          <div className='bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6'>
            <div className='text-center'>
              <h1 className='text-title mb-1 mt-4 text-xl font-semibold'>
                Verify Your Phone
              </h1>
              <p className='text-sm'>
                We've sent a verification code to {formData.phoneNumber}
              </p>
            </div>

            <div className='mt-6 space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='otp' className='block text-sm'>
                  Verification Code
                </Label>
                <Input
                  type='text'
                  required
                  name='otp'
                  id='otp'
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className='input sz-md variant-mixed text-center text-lg tracking-widest'
                  placeholder='000000'
                  maxLength={6}
                />
              </div>

              <Button
                type='button'
                onClick={handleVerifyOtp}
                className='w-full'
                disabled={!otpCode.trim() || pending}>
                {pending ? 'Verifying...' : 'Sign In'}
              </Button>

              <p className='text-center text-sm text-muted-foreground'>
                Didn't receive the code?{' '}
                <button
                  type='button'
                  onClick={() => setStep('signin')}
                  className='text-primary hover:underline'>
                  Go back
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

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

          {/* Authentication Method Toggle */}
          <div className='mt-6 flex gap-2 p-1 bg-muted rounded-lg'>
            <button
              type='button'
              onClick={() => setAuthMethod('email')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                authMethod === 'email'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
              <Mail className='inline-block w-4 h-4 mr-2' />
              Email
            </button>
            <button
              type='button'
              onClick={() => setAuthMethod('phone')}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
                authMethod === 'phone'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
              <Phone className='inline-block w-4 h-4 mr-2' />
              Phone
            </button>
          </div>

          <div className='mt-6 space-y-4'>
            {authMethod === 'email' ? (
              <>
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
              </>
            ) : (
              /* Phone Number Field */
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
                  className='input sz-md variant-mixed'
                  placeholder='Enter your phone number with country code'
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={!isFormValid() || pending}>
              {pending ? 'Signing in...' : authMethod === 'phone' ? 'Send OTP' : 'Sign In'}
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
