/** @format */
import { Icons } from '@/components/sidebar/icons';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <div className='fixed top-5 left-2 flex items-center gap-2'>
        <Button variant={'outline'} asChild>
          <Link href={'/'}>
            <Icons.ArrowLeft className='w-2 h-2' />
            Back
          </Link>
        </Button>
      </div>
      <div className='fixed top-5 right-2'>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
