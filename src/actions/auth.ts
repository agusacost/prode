'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { RegisterSchema, LoginSchema } from '@/lib/schemas/auth'

export async function register(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = RegisterSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
      },
    },
  })

  if (error) {
    return { error: { general: [error.message] } }
  }

  return { success: true, user: data.user }
}

export async function login(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = LoginSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: { general: [error.message] } }
  }

  return { success: true, user: data.user }
}

export async function logout(_formData?: FormData) {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
}
