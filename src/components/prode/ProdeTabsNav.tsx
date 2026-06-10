'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BarChart2, List, Map, Users, Star, Trophy, GitBranch } from 'lucide-react'

const tabs = [
  { label: 'Posiciones',      href: (id: string) => `/prodes/${id}`,          icon: BarChart2  },
  { label: 'Mis predicciones', href: (id: string) => `/prodes/${id}/fixture`,  icon: List       },
  { label: 'Grupos',          href: (id: string) => `/prodes/${id}/grupos`,    icon: Map        },
  { label: 'Mis cruces',      href: (id: string) => `/prodes/${id}/cruces`,    icon: GitBranch  },
  { label: 'Comparar',        href: (id: string) => `/prodes/${id}/comparar`,  icon: Users      },
  { label: 'Campeón',         href: (id: string) => `/prodes/${id}/campeon`,   icon: Trophy     },
  { label: 'Mis stats',       href: (id: string) => `/prodes/${id}/mis-stats`, icon: Star       },
]

export function ProdeTabsNav({ prodeId, prodeName }: { prodeId: string; prodeName?: string }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === `/prodes/${prodeId}`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="space-y-2">
      {prodeName && (
        <h2 className="text-xl font-bold text-foreground">{prodeName}</h2>
      )}
      <div className="border-b">
        <nav className="-mb-px flex gap-0 overflow-x-auto">
          {tabs.map(({ label, href, icon: Icon }) => {
            const resolvedHref = href(prodeId)
            const active = isActive(resolvedHref)
            return (
              <Link
                key={label}
                href={resolvedHref}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">
                  {label === 'Mis predicciones' ? 'Predic.' :
                   label === 'Posiciones' ? 'Pos.' :
                   label === 'Mis stats' ? 'Stats' :
                   label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
