/** @format */
import { getSession } from '@/lib/auth/auth-server';

export default async function Page() {
  const session = await getSession();
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
