import { createServerSupabaseClient } from '@/lib/supabase/server'
import StagesForm from './stages-form'

export default async function RondasPage() {
  const supabase = await createServerSupabaseClient()

  const { data: config } = await supabase
    .from('tournament_config')
    .select('value')
    .eq('key', 'enabled_stages')
    .maybeSingle()

  const enabledStages = config?.value ? config.value.split(',') : ['group_stage']

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Habilitar rondas</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Controlá qué etapas del torneo pueden ver y predecir los participantes.
        </p>
      </div>
      <StagesForm enabledStages={enabledStages} />
    </div>
  )
}
