import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth-config'
import { redirect } from 'next/navigation'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return session
}

export async function requireRole(allowedRoles: string[]) {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/unauthorized')
  }
  
  return session
}

export async function requireAdmin() {
  return await requireRole(['SUPER_ADMIN', 'COUNTRY_ADMIN'])
}

export async function requireSuperAdmin() {
  return await requireRole(['SUPER_ADMIN'])
}
