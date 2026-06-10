import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Trophy, Plus, Hash } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: memberships } = await supabase
    .from('prode_members')
    .select('prode_id, role, total_score, prodes(id, name, invite_code)')
    .eq('user_id', user.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mis Prodes</h2>
        <div className="flex gap-2">
          <Link href="/join" className={cn(buttonVariants({ variant: 'outline' }))}>
            <Hash className="size-4 mr-1" />
            Unirme con código
          </Link>
          <Link href="/prodes/new" className={cn(buttonVariants())}>
            <Plus className="size-4 mr-1" />
            Crear prode
          </Link>
        </div>
      </div>

      {!memberships || memberships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="size-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-6">Todavía no participás en ningún prode</p>
            <div className="flex gap-3">
              <Link href="/prodes/new" className={cn(buttonVariants())}>Crear uno</Link>
              <Link href="/join" className={cn(buttonVariants({ variant: 'outline' }))}>Unirme con código</Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberships.map((m) => {
            const prode = m.prodes as any
            return (
              <Link key={m.prode_id} href={`/prodes/${m.prode_id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{prode?.name ?? 'Sin nombre'}</CardTitle>
                      {m.role === 'owner' && (
                        <Badge variant="secondary" className="shrink-0 text-xs">Creador</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-mono">{prode?.invite_code}</span>
                      <span className="text-lg font-bold">{m.total_score ?? 0} pts</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
