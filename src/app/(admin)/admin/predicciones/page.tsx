import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function AdminPrediccionesPage() {
  const admin = createAdminClient()

  const { data: prodes } = await admin
    .from('prodes')
    .select('id, name, invite_code, created_at, prode_members(count)')
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Predicciones cargadas</h2>
        <p className="text-sm text-muted-foreground">
          Elegí un prode para ver las predicciones cargadas por sus miembros.
        </p>
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prode</TableHead>
              <TableHead>Código de invitación</TableHead>
              <TableHead className="text-center">Miembros</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(prodes ?? []).map((prode) => (
              <TableRow key={prode.id}>
                <TableCell className="font-medium">{prode.name}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {prode.invite_code}
                </TableCell>
                <TableCell className="text-center">
                  {(prode.prode_members as any)?.[0]?.count ?? 0}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/admin/predicciones/${prode.id}`}
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    Ver predicciones
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
