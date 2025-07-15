import { redirect } from 'next/navigation';

export default async function AdminPage() {
  // Redirect to the dashboard page
  redirect('/admin/dashboard');
}
