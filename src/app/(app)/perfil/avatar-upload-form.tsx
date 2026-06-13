'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateAvatar, removeAvatar } from '@/actions/profile'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MAX_AVATAR_SIZE, ALLOWED_AVATAR_TYPES } from '@/lib/schemas/profile'
import { ImagePlus, Trash2 } from 'lucide-react'

interface Props {
  currentAvatarUrl: string | null
  username: string
}

export function AvatarUploadForm({ currentAvatarUrl, username }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError('Formato no permitido. Usá JPG, PNG o WEBP')
      e.target.value = ''
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError('La imagen no puede superar los 2MB')
      e.target.value = ''
      return
    }

    setPreviewUrl(URL.createObjectURL(file))
    setLoading(true)

    const formData = new FormData()
    formData.set('avatar', file)

    const res = await updateAvatar(formData)

    if ('error' in res) {
      setError(Object.values(res.error ?? {})[0]?.[0] ?? 'Error al subir la imagen')
      setPreviewUrl(null)
    } else {
      setAvatarUrl(res.avatarUrl)
      router.refresh()
    }

    setLoading(false)
    e.target.value = ''
  }

  async function handleRemove() {
    setRemoving(true)
    setError(null)

    const res = await removeAvatar()

    if ('error' in res) {
      setError(Object.values(res.error ?? {})[0]?.[0] ?? 'Error al quitar la imagen')
    } else {
      setAvatarUrl(null)
      setPreviewUrl(null)
      router.refresh()
    }

    setRemoving(false)
  }

  const displayUrl = previewUrl ?? avatarUrl ?? undefined

  return (
    <div className="flex items-center gap-4">
      <Avatar size="lg" className="size-20">
        {displayUrl && <AvatarImage src={displayUrl} />}
        <AvatarFallback className="text-lg bg-primary text-primary-foreground">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_AVATAR_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="size-4 mr-1.5" />
            {loading ? 'Subiendo...' : 'Cambiar foto'}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={removing || loading}
              onClick={handleRemove}
            >
              <Trash2 className="size-4 mr-1.5" />
              {removing ? 'Quitando...' : 'Quitar foto'}
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">JPG, PNG o WEBP. Máximo 2MB.</p>
      </div>
    </div>
  )
}
