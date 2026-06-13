'use client'

import Link from 'next/link'
import { logout } from '@/actions/auth'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { User } from 'lucide-react'

interface Props {
  username: string
  avatarUrl?: string | null
}

export function UserMenu({ username, avatarUrl }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'ghost' }), 'flex items-center gap-2 px-2')}>
        <Avatar className="size-7">
          {avatarUrl && <AvatarImage src={avatarUrl} />}
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden sm:block">{username}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem render={<Link href="/perfil" />}>
          <User className="size-4" />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <form action={logout} className="w-full">
            <button type="submit" className="w-full text-left text-destructive text-sm">
              Cerrar sesión
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
