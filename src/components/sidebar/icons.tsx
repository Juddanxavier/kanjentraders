/** @format */

import { ArrowLeft, LogOut, LucideProps } from 'lucide-react';

export const Icons = {
  ArrowLeft: (props: LucideProps) => <ArrowLeft {...props} />,
  LogOut: (props: LucideProps) => <LogOut {...props} />,
  logo: (props: LucideProps) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='1em'
      height='1em'
      viewBox='0 0 24 24'
      {...props}></svg>
  ),
};
