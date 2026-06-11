import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: adminUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!adminUser?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-lg font-bold">Panel Admin</Link>
              <Badge variant="destructive" className="text-xs">Admin</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/predicciones" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                Predicciones
              </Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                Ver app
              </Link>
              <form action={logout}>
                <button type="submit" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
