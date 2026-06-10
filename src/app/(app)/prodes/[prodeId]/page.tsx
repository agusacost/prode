import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LeaderboardTable } from '@/components/prode/LeaderboardTable'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Copy } from 'lucide-react'

export default async function ProdePage({
  params,
}: {
  params: Promise<{ prodeId: string }>
}) {
  const { prodeId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: prode }, { data: members }] = await Promise.all([
    supabase
      .from('prodes')
      .select('*')
      .eq('id', prodeId)
      .single(),
    supabase
      .from('prode_members')
      .select('*, user:users(username, avatar_url)')
      .eq('prode_id', prodeId)
      .order('total_score', { ascending: false })
      .order('exact_results', { ascending: false })
      .order('correct_signs', { ascending: false })
      .order('joined_at', { ascending: true }),
  ])

  if (!prode) {
    return <div className="text-muted-foreground">Prode no encontrado.</div>
  }

  return (
    <div className="space-y-6">
      <LeaderboardTable
        initialMembers={(members ?? []) as any}
        prodeId={prodeId}
        currentUserId={user.id}
      />

      <Card>
        <CardContent className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Código de invitación
            </p>
            <p className="font-mono font-semibold text-foreground">{prode.invite_code}</p>
          </div>
          <Link
            href={`/join?code=${prode.invite_code}`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <Copy className="size-3.5 mr-1.5" />
            Compartir
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
