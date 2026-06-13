'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Medal } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  role: string
  total_score: number
  exact_results: number
  correct_signs: number
  user: { username: string; avatar_url: string | null } | null
}

interface Props {
  initialMembers: Member[]
  prodeId: string
  currentUserId: string
}

const MEDAL_COLORS = [
  'text-yellow-500', // 1st
  'text-slate-400',  // 2nd
  'text-amber-600',  // 3rd
]

export function LeaderboardTable({ initialMembers, prodeId, currentUserId }: Props) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`leaderboard:${prodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prode_members',
          filter: `prode_id=eq.${prodeId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('prode_members')
            .select('*, user:users(username, avatar_url)')
            .eq('prode_id', prodeId)
            .order('total_score', { ascending: false })
            .order('exact_results', { ascending: false })
            .order('correct_signs', { ascending: false })
            .order('joined_at', { ascending: true })

          if (data) {
            setMembers(data as Member[])
            const changedUserId = (payload.new as any)?.user_id
            if (changedUserId) {
              setUpdatedIds(prev => new Set([...prev, changedUserId]))
              setTimeout(() => {
                setUpdatedIds(prev => {
                  const next = new Set(prev)
                  next.delete(changedUserId)
                  return next
                })
              }, 2000)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [prodeId])

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">Pos.</TableHead>
            <TableHead>Jugador</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Exactos</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Parciales</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                Aún no hay miembros en este prode.
              </TableCell>
            </TableRow>
          )}
          {members.map((member, idx) => {
            const isMe = member.user_id === currentUserId
            const isFlashing = updatedIds.has(member.user_id)
            const username = member.user?.username ?? 'Desconocido'

            return (
              <TableRow
                key={member.id}
                className={`
                  transition-colors duration-500
                  ${isMe ? 'bg-primary/5' : ''}
                  ${isFlashing ? 'bg-yellow-50 animate-pulse' : ''}
                `}
              >
                <TableCell className="text-center font-semibold">
                  {idx < 3 ? (
                    <Medal className={`size-4 mx-auto ${MEDAL_COLORS[idx]}`} />
                  ) : (
                    <span className="text-muted-foreground text-sm">{idx + 1}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7 shrink-0">
                      {member.user?.avatar_url && <AvatarImage src={member.user.avatar_url} />}
                      <AvatarFallback className="text-xs bg-muted">
                        {username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`text-sm ${isMe ? 'font-semibold' : ''}`}>
                      {username}
                    </span>
                    {isMe && <Badge variant="secondary" className="text-xs">Vos</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold text-base">
                  {member.total_score ?? 0}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                  {member.exact_results ?? 0}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                  {member.correct_signs ?? 0}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
