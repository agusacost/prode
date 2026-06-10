'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveGroupBracket } from '@/actions/bracket'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { GitBranch } from 'lucide-react'

export default function ResolveButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    const result = await resolveGroupBracket()
    if ('error' in result) {
      toast.error(result.error as string)
    } else {
      toast.success(`Bracket resuelto: ${result.resolved} partidos actualizados`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Button variant="outline" onClick={handle} disabled={loading || pendingCount === 0}>
      <GitBranch className="size-4 mr-2" />
      {loading ? 'Resolviendo...' : `Resolver bracket (${pendingCount} pendientes)`}
    </Button>
  )
}
