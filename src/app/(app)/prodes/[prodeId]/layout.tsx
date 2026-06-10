import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProdeTabsNav } from '@/components/prode/ProdeTabsNav'

export default async function ProdeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: prode } = await supabase
    .from('prodes')
    .select('id, name')
    .eq('id', prodeId)
    .single()

  if (!prode) redirect('/dashboard')

  return (
    <div className="space-y-6">
      <ProdeTabsNav prodeId={prodeId} prodeName={prode.name} />
      {children}
    </div>
  )
}
