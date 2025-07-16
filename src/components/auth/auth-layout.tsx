'use client'

import { useSession } from '@/lib/auth/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function AuthLayout({ children, requireAdmin = false }: AuthLayoutProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
      return
    }

    if (session && requireAdmin && !['admin', 'super_admin'].includes(session.user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [session, isPending, requireAdmin, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (requireAdmin && !['admin', 'super_admin'].includes(session.user.role)) {
    return null
  }

  return <>{children}</>
}
