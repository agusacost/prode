import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AvatarUploadForm } from './avatar-upload-form'

export default async function PerfilPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('username, avatar_url')
    .eq('id', user.id)
    .single()

  const username = profile?.username ?? user.email ?? 'Usuario'

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mi perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">{username}</p>
      </div>

      <AvatarUploadForm currentAvatarUrl={profile?.avatar_url ?? null} username={username} />
    </div>
  )
}
