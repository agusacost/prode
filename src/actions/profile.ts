'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MAX_AVATAR_SIZE, ALLOWED_AVATAR_TYPES } from '@/lib/schemas/profile'

export async function updateAvatar(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { general: ['No autenticado'] } }
  }

  const file = formData.get('avatar')

  if (!(file instanceof File) || file.size === 0) {
    return { error: { avatar: ['Seleccioná una imagen'] } }
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return { error: { avatar: ['Formato no permitido. Usá JPG, PNG o WEBP'] } }
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { error: { avatar: ['La imagen no puede superar los 2MB'] } }
  }

  const path = `${user.id}/avatar`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { error: { general: [uploadError.message] } }
  }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${publicUrl}?v=${Date.now()}`

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) {
    return { error: { general: [updateError.message] } }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/perfil')

  return { success: true, avatarUrl }
}

export async function removeAvatar() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: { general: ['No autenticado'] } }
  }

  await supabase.storage.from('avatars').remove([`${user.id}/avatar`])

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: null })
    .eq('id', user.id)

  if (updateError) {
    return { error: { general: [updateError.message] } }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/perfil')

  return { success: true }
}
