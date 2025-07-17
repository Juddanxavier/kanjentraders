import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      country: string
      whiteLabel: string
      status: string
      emailVerified: Date | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    country: string
    whiteLabel: string
    status: string
    emailVerified: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    country: string
    whiteLabel: string
    status: string
    emailVerified: Date | null
  }
}
