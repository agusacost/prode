'use client'

import { FormEvent, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { joinProde } from '@/actions/prodes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function JoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) setInviteCode(code)
  }, [searchParams])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors(null)

    const formData = new FormData()
    formData.append('inviteCode', inviteCode)

    const result = await joinProde(formData)

    if ('error' in result) {
      setErrors(result.error || {})
      setLoading(false)
    } else {
      router.push(`/prodes/${result.prodeId}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Unirme a un prode</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingresá el código de invitación</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors?.general && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{errors.general[0]}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="inviteCode">Código de invitación</Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                placeholder="PRD-ABC123"
              />
              {errors?.inviteCode && <p className="text-xs text-destructive">{errors.inviteCode[0]}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Uniéndome...' : 'Unirme'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
