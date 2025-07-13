/** @format */

import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return <p>Not authenticated</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>{session.user.email}</p>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
