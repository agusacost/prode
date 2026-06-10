'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProde } from '@/actions/prodes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CreateProdePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors(null)

    const formData = new FormData(e.currentTarget)
    const result = await createProde(formData)

    if ('error' in result) {
      setErrors(result.error || {})
      setLoading(false)
    } else {
      router.push(`/prodes/${result.prode.id}`)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Crear prode</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del prode</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors?.general && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{errors.general[0]}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del prode</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                minLength={3}
                maxLength={60}
                placeholder="ej: Los Pibes de la Oficina"
              />
              {errors?.name && <p className="text-xs text-destructive">{errors.name[0]}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creando...' : 'Crear prode'}
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
