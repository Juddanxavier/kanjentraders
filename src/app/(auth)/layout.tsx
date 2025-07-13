/** @format */

import { Icons } from '@/components/sidebar/icons';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <Button className='fixed top-5 left-2' variant={'outline'} asChild>
        <Link href={'/'}>
          <Icons.ArrowLeft className='w-2 h-2' />
          Back
        </Link>
      </Button>
      {children}
    </div>
  );
}
