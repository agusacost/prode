'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { register } from '@/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors(null)

    const formData = new FormData(e.currentTarget)
    const result = await register(formData)

    if ('error' in result) {
      setErrors(result.error || {})
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 py-12 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Prode Mundial 2026</h1>
          <p className="text-sm text-muted-foreground mt-1">Creá tu cuenta para jugar</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crear cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors?.general && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive">{errors.general[0]}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="tu@email.com" />
                {errors?.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="ej: goleador99"
                  minLength={3}
                  maxLength={30}
                />
                {errors?.username && <p className="text-xs text-destructive">{errors.username[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 8 caracteres"
                />
                {errors?.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tenés cuenta?{' '}
                <a href="/login" className="font-medium text-primary hover:underline">
                  Iniciá sesión
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
