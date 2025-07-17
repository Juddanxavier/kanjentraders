import { getSession, signIn, signOut, useSession } from 'next-auth/react'

export { getSession, signIn, signOut, useSession }

export const authClient = {
  signIn: (credentials: { email: string; password: string }) => {
    return signIn('credentials', {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    })
  },
  signOut: () => {
    return signOut({ redirect: false })
  },
  getSession,
}
