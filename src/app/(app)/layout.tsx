import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserMenu } from '@/components/prode/UserMenu'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  const username = profile?.username ?? user.email ?? 'Usuario'

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <Link href="/dashboard" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
              Prode Mundial 2026
            </Link>
            <UserMenu username={username} avatarUrl={profile?.avatar_url ?? null} />
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
