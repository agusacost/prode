# Planning — Prode Mundial 2026
> Stack: Next.js 14+ (App Router) · Supabase (Postgres + Auth + Realtime) · Tailwind CSS · Vercel

---

## Índice

1. [Modelo de datos](#1-modelo-de-datos)
2. [Políticas RLS](#2-políticas-rls)
3. [Seed data](#3-seed-data)
4. [Estructura de carpetas Next.js](#4-estructura-de-carpetas-nextjs)
5. [Módulos funcionales](#5-módulos-funcionales)
6. [Sistema de puntuación](#6-sistema-de-puntuación)
7. [Rutas y páginas](#7-rutas-y-páginas)
8. [Server Actions y API Routes](#8-server-actions-y-api-routes)
9. [Orden de implementación](#9-orden-de-implementación)
10. [Variables de entorno](#10-variables-de-entorno)

---

## 1. Modelo de datos

### `users` (extendida de `auth.users`)
```sql
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);
```

### `groups`
```sql
create table public.groups (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,       -- "Grupo A", "Grupo B", ...
  stage text not null        -- 'group_stage' | 'knockout'
);
```

### `teams`
```sql
create table public.teams (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  code      char(3) not null,   -- "ARG", "BRA", etc.
  flag_url  text,
  group_id  uuid references public.groups(id)
);
```

### `matches`
```sql
create table public.matches (
  id           uuid primary key default gen_random_uuid(),
  home_team_id uuid references public.teams(id),
  away_team_id uuid references public.teams(id),
  stage        text not null,
  -- 'group_stage' | 'round_of_32' | 'round_of_16' | 'quarterfinal'
  -- | 'semifinal' | 'third_place' | 'final'
  match_date   timestamptz not null,
  venue        text,
  status       text not null default 'scheduled'
  -- 'scheduled' | 'in_progress' | 'finished'
);
```

### `match_results`
```sql
create table public.match_results (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid unique not null references public.matches(id),
  home_goals   int not null,
  away_goals   int not null,
  -- Para eliminatoria: resultado a 90 minutos reglamentarios.
  -- Si hay empate en knockout, se registra igual (ej: 1-1).
  -- El ganador por penales/extra NO afecta el cálculo de puntos.
  updated_at   timestamptz not null default now()
);
```

### `prodes`
```sql
create table public.prodes (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.users(id),
  name        text not null,
  invite_code text unique not null,  -- generado automáticamente, ej: "MUNDIAL-4X9K"
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
```

### `prode_members`
```sql
create table public.prode_members (
  id             uuid primary key default gen_random_uuid(),
  prode_id       uuid not null references public.prodes(id) on delete cascade,
  user_id        uuid not null references public.users(id),
  role           text not null default 'member',  -- 'owner' | 'member'
  total_score    int not null default 0,
  exact_results  int not null default 0,   -- para desempate: cantidad de 3pts
  correct_signs  int not null default 0,   -- para desempate: cantidad de 1pt
  joined_at      timestamptz not null default now(),
  unique (prode_id, user_id)
);
```

### `predictions`
```sql
create table public.predictions (
  id            uuid primary key default gen_random_uuid(),
  prode_id      uuid not null references public.prodes(id) on delete cascade,
  user_id       uuid not null references public.users(id),
  match_id      uuid not null references public.matches(id),
  home_goals    int not null,
  away_goals    int not null,
  points_earned int,          -- null hasta que se cargue el resultado
  submitted_at  timestamptz not null default now(),
  unique (prode_id, user_id, match_id)
);
```

---

## 2. Políticas RLS

Habilitar RLS en todas las tablas y definir:

```sql
-- users: lectura pública, escritura solo del propio usuario
alter table public.users enable row level security;
create policy "usuarios pueden leer todos" on public.users for select using (true);
create policy "usuarios editan su perfil" on public.users for update using (auth.uid() = id);

-- prodes: lectura para miembros, escritura para owner
alter table public.prodes enable row level security;
create policy "miembros ven su prode" on public.prodes for select
  using (exists (
    select 1 from public.prode_members
    where prode_id = prodes.id and user_id = auth.uid()
  ));
create policy "usuario crea prode" on public.prodes for insert
  with check (owner_id = auth.uid());
create policy "owner edita prode" on public.prodes for update
  using (owner_id = auth.uid());

-- prode_members: miembros del mismo prode pueden ver la tabla
alter table public.prode_members enable row level security;
create policy "miembros ven su prode" on public.prode_members for select
  using (exists (
    select 1 from public.prode_members pm2
    where pm2.prode_id = prode_members.prode_id and pm2.user_id = auth.uid()
  ));
create policy "usuario se une a prode" on public.prode_members for insert
  with check (user_id = auth.uid());
create policy "usuario abandona prode" on public.prode_members for delete
  using (user_id = auth.uid() and role = 'member');

-- matches, teams, groups: lectura pública
alter table public.matches enable row level security;
create policy "lectura publica" on public.matches for select using (true);
alter table public.teams enable row level security;
create policy "lectura publica" on public.teams for select using (true);
alter table public.groups enable row level security;
create policy "lectura publica" on public.groups for select using (true);

-- match_results: lectura pública, escritura solo admin
alter table public.match_results enable row level security;
create policy "lectura publica" on public.match_results for select using (true);
create policy "admin carga resultados" on public.match_results for all
  using (exists (
    select 1 from public.users where id = auth.uid() and is_admin = true
  ));

-- predictions: solo el propio usuario dentro de su prode
alter table public.predictions enable row level security;
create policy "usuario ve sus predicciones" on public.predictions for select
  using (user_id = auth.uid());
create policy "usuario crea prediccion" on public.predictions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.prode_members
      where prode_id = predictions.prode_id and user_id = auth.uid()
    )
  );
create policy "usuario edita prediccion antes del partido" on public.predictions for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches
      where id = predictions.match_id and match_date > now()
    )
  );
```

---

## 3. Seed data

Crear un archivo `supabase/seed.sql` con:

- Los **32 grupos** del mundial (en el Mundial 2026 son 12 grupos de 4 equipos = 48 equipos clasificados, más 3 sedes: USA, México, Canadá).
- Los **48 equipos** clasificados con código y URL de bandera (usar flags.open-meteo.com o similar CDN).
- Los **partidos de fase de grupos** (48 partidos) con fecha y hora.
- Los partidos de eliminatoria se cargan vacíos al principio (sin `home_team_id` / `away_team_id`) y se actualizan cuando se conocen los clasificados, o se pre-cargan con un sistema de "slots" (ej: `"Ganador Grupo A"`).

```sql
-- Ejemplo de estructura del seed
insert into public.groups (id, name, stage) values
  ('...', 'Grupo A', 'group_stage'),
  ('...', 'Grupo B', 'group_stage'),
  ...;

insert into public.teams (id, name, code, flag_url, group_id) values
  ('...', 'Argentina', 'ARG', 'https://...', '<grupo_id>'),
  ...;

insert into public.matches (id, home_team_id, away_team_id, stage, match_date, venue) values
  ('...', '<arg_id>', '<..._id>', 'group_stage', '2026-06-12 21:00:00+00', 'MetLife Stadium'),
  ...;
```

---

## 4. Estructura de carpetas Next.js

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # layout con navbar, requiere sesión
│   │   ├── dashboard/
│   │   │   └── page.tsx            # lista de prodes del usuario
│   │   ├── prodes/
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # crear prode
│   │   │   └── [prodeId]/
│   │   │       ├── page.tsx        # tabla de posiciones del prode
│   │   │       ├── fixture/
│   │   │       │   └── page.tsx    # partidos + predicciones del usuario
│   │   │       └── settings/
│   │   │           └── page.tsx    # config del prode (solo owner)
│   │   └── join/
│   │       └── page.tsx            # unirse por código
│   ├── (admin)/
│   │   ├── layout.tsx              # layout solo admin
│   │   └── admin/
│   │       ├── page.tsx            # lista de partidos
│   │       └── matches/
│   │           └── [matchId]/
│   │               └── page.tsx    # cargar/editar resultado
│   ├── api/
│   │   └── score/
│   │       └── route.ts            # POST: calcular puntos tras cargar resultado
│   └── layout.tsx
├── actions/
│   ├── auth.ts                     # login, register, logout
│   ├── prodes.ts                   # crear, unirse, abandonar
│   ├── predictions.ts              # guardar, editar predicciones
│   └── results.ts                  # cargar resultado + trigger de scoring
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # cliente browser
│   │   ├── server.ts               # cliente server (cookies)
│   │   └── middleware.ts           # helper para el middleware de Next
│   ├── scoring.ts                  # lógica pura de cálculo de puntos
│   └── utils.ts
├── components/
│   ├── ui/                         # componentes base (botones, inputs, etc.)
│   ├── fixture/
│   │   ├── MatchCard.tsx
│   │   └── PredictionForm.tsx
│   ├── leaderboard/
│   │   └── LeaderboardTable.tsx    # con Realtime hook
│   └── prodes/
│       ├── ProdeCard.tsx
│       └── InviteCodeBadge.tsx
├── hooks/
│   └── useLeaderboard.ts           # Supabase Realtime subscription
└── middleware.ts                   # protección de rutas
```

---

## 5. Módulos funcionales

### 5.1 Autenticación

- Login y registro con email/password via Supabase Auth.
- OAuth con Google (configurar en Supabase Dashboard → Authentication → Providers).
- Al registrarse se inserta una fila en `public.users` via trigger en Postgres:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- Middleware de Next.js (`middleware.ts`) protege todas las rutas bajo `(app)` y `(admin)`.
- El rol admin se chequea en el layout de `(admin)` via Server Component.

### 5.2 Prodes

- **Crear prode**: Server Action que inserta en `prodes` y en `prode_members` con `role = 'owner'`. El `invite_code` se genera con un helper que combina un prefijo + 6 caracteres alfanuméricos aleatorios.
- **Unirse por código**: Server Action que busca el prode por `invite_code` e inserta en `prode_members`. Valida que el usuario no sea ya miembro y que el prode esté activo.
- **Link de invitación**: la ruta `/join?code=MUNDIAL-4X9K` pre-rellena el formulario con el código. Si el usuario no está logueado, redirige al login y vuelve al join después.
- **Listar mis prodes**: query a `prode_members` + join con `prodes` filtrando por `user_id = auth.uid()`.
- **Salir de un prode**: solo `role = 'member'`. El owner no puede salir; puede marcar el prode como `is_active = false`.

### 5.3 Fixture y partidos

- Vista de fixture agrupada por fase o por fecha (toggle en la UI).
- Cada `MatchCard` muestra: equipos, fecha/hora, estado (`scheduled` / `in_progress` / `finished`) y el resultado si existe.
- Los partidos pasados muestran el resultado oficial y los puntos obtenidos por el usuario.
- Los partidos futuros muestran el formulario de predicción (si el usuario pertenece al prode).

### 5.4 Predicciones

- Formulario por partido: dos inputs numéricos (goles local / visitante).
- Se habilita solo si `match.match_date > now()` y `match.status = 'scheduled'`. Esta validación se hace **también en backend** en la Server Action.
- **Predicción bulk**: grilla de todos los partidos de una fase con inputs en línea. Un solo botón "Guardar todos" ejecuta un `upsert` masivo en `predictions`.
- Al guardar, se usa `upsert` con `on conflict (prode_id, user_id, match_id)` para manejar ediciones.

### 5.5 Tabla de posiciones

- Query con join entre `prode_members` y `users`, ordenada por `total_score DESC`, `exact_results DESC`, `correct_signs DESC`.
- Actualización en tiempo real: hook `useLeaderboard` que suscribe al canal de Supabase Realtime en la tabla `prode_members` filtrando por `prode_id`.

```ts
// hooks/useLeaderboard.ts
const channel = supabase
  .channel(`leaderboard:${prodeId}`)
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'prode_members', filter: `prode_id=eq.${prodeId}` },
    (payload) => { /* actualizar estado local */ }
  )
  .subscribe();
```

### 5.6 Panel de admin

- Ruta protegida `/admin` visible solo para usuarios con `is_admin = true`.
- Lista todos los partidos. Los `finished` muestran el resultado cargado.
- Formulario para cargar resultado de un partido: inputs de goles local/visitante.
- Al guardar, llama a la Server Action `loadResult` que:
  1. Hace upsert en `match_results`.
  2. Actualiza `matches.status = 'finished'`.
  3. Llama a `recalcularPuntos(matchId)`.

---

## 6. Sistema de puntuación

### Reglas fijas

| Caso | Puntos |
|---|---|
| Resultado exacto (score idéntico) | 3 pts |
| Signo correcto (ganador o empate, score incorrecto) | 1 pt |
| Fallo total | 0 pts |

> Los partidos de fase eliminatoria se evalúan **siempre a 90 minutos reglamentarios**. Un empate 1-1 a 90' puntúa como empate, sin importar quién gane por penales o extra time.

### Implementación — `lib/scoring.ts`

```ts
export type Score = { home: number; away: number };

export function calcularPuntos(prediccion: Score, resultado: Score): number {
  if (prediccion.home === resultado.home && prediccion.away === resultado.away) {
    return 3; // exacto
  }
  const signo = (s: Score) => Math.sign(s.home - s.away);
  if (signo(prediccion) === signo(resultado)) {
    return 1; // signo correcto
  }
  return 0;
}
```

### Server Action `recalcularPuntos(matchId)` — `actions/results.ts`

```
1. Obtener match_results para el matchId
2. Obtener todas las predictions para ese matchId (de todos los prodes)
3. Para cada prediction:
   a. calcularPuntos(prediction, result)
   b. UPDATE predictions SET points_earned = X WHERE id = prediction.id
4. Para cada (prode_id, user_id) afectado:
   a. Sumar total_score, exact_results, correct_signs desde predictions
      WHERE prode_id = X AND user_id = Y AND points_earned IS NOT NULL
   b. UPDATE prode_members SET total_score = ..., exact_results = ..., correct_signs = ...
```

La función es **idempotente**: recalcula desde cero en base a todas las predicciones con resultado, por lo que si se corrige un resultado, ejecutarla de nuevo produce el estado correcto.

### Desempate en tabla de posiciones

1. `total_score` DESC
2. `exact_results` DESC (cantidad de predicciones con 3 puntos)
3. `correct_signs` DESC (cantidad de predicciones con 1 punto)
4. `joined_at` ASC (quien se unió primero, como último criterio)

---

## 7. Rutas y páginas

| Ruta | Descripción | Auth |
|------|-------------|------|
| `/login` | Formulario de login + OAuth Google | pública |
| `/register` | Formulario de registro | pública |
| `/join?code=XXX` | Unirse a un prode por código | pública (redirige al login) |
| `/dashboard` | Lista de prodes del usuario | ✅ |
| `/prodes/new` | Crear un nuevo prode | ✅ |
| `/prodes/[prodeId]` | Tabla de posiciones del prode | ✅ miembro |
| `/prodes/[prodeId]/fixture` | Fixture + formulario de predicciones | ✅ miembro |
| `/prodes/[prodeId]/settings` | Configuración del prode | ✅ owner |
| `/admin` | Lista de partidos para cargar resultados | ✅ admin |
| `/admin/matches/[matchId]` | Formulario para cargar resultado | ✅ admin |

---

## 8. Server Actions y API Routes

Todos los mutations se implementan como **Server Actions** en Next.js (no API Routes), excepto el trigger de recálculo que puede exponerse como API Route interna si se necesita llamar desde un webhook.

### `actions/auth.ts`
- `loginWithEmail(email, password)`
- `loginWithGoogle()`
- `register(email, password, username)`
- `logout()`

### `actions/prodes.ts`
- `createProde(name)` → genera invite_code, inserta prode + miembro owner
- `joinProde(inviteCode)` → valida código, inserta miembro
- `leaveProde(prodeId)` → valida rol member, elimina de prode_members
- `closeProde(prodeId)` → solo owner, marca is_active = false

### `actions/predictions.ts`
- `savePredictions(prodeId, predictions: Array<{matchId, home, away}>)` → upsert bulk, valida que cada partido no haya empezado

### `actions/results.ts`
- `loadResult(matchId, homeGoals, awayGoals)` → upsert match_results, actualiza status, llama recalcularPuntos
- `recalcularPuntos(matchId)` → idempotente, recalcula scoring completo

---

## 9. Orden de implementación

### Fase 1 — Base
1. Inicializar repo Next.js con Tailwind y `@supabase/ssr`
2. Crear migraciones SQL (tablas + RLS + trigger de usuario)
3. Seed data: grupos, equipos y fixture completo del Mundial 2026
4. Configurar middleware de Next.js para protección de rutas

### Fase 2 — Auth
5. Páginas de login y registro (email + Google OAuth)
6. Flujo de sesión persistente con cookies (Supabase SSR)
7. Edición de perfil (username, avatar)

### Fase 3 — Prodes
8. Crear prode (formulario + Server Action + generación de invite_code)
9. Unirse por código (formulario + validación + página `/join`)
10. Dashboard con lista de prodes
11. Salir de un prode / cerrar prode (owner)

### Fase 4 — Predicciones
12. Vista de fixture por prode (agrupada por fase)
13. Formulario de predicción por partido (individual)
14. Predicción bulk (grilla de fase completa)
15. Visualización de predicciones propias ya guardadas

### Fase 5 — Resultados y scoring
16. Panel de admin: lista de partidos y formulario de resultado
17. Server Action `loadResult` + `recalcularPuntos`
18. Mostrar puntos obtenidos en cada partido del fixture

### Fase 6 — Tabla de posiciones
19. Leaderboard estático con query ordenada
20. Integrar Supabase Realtime para actualizaciones en vivo

### Fase 7 — Pulido
21. Estados de carga y error en todos los formularios
22. Responsive mobile
23. Manejo de edge cases (prode sin predicciones, partidos sin resultado, etc.)
24. Deploy a Vercel + configurar variables de entorno de producción

---

## 10. Variables de entorno

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>   # solo en Server Actions admin
```

En Vercel, configurar las mismas variables en el dashboard del proyecto.

---

## Notas para Claude Code

- Usar **siempre el cliente de servidor** (`createServerClient` de `@supabase/ssr`) en Server Components y Server Actions. El cliente browser solo en Client Components.
- Las Server Actions deben **validar la sesión** al inicio con `supabase.auth.getUser()` y retornar error si no hay usuario.
- El `recalcularPuntos` debe correr con el **service role key** (bypassa RLS) ya que necesita escribir en tablas de múltiples usuarios.
- Para el seed del fixture, verificar las fechas oficiales del Mundial 2026 (inicio: 11 de junio de 2026).
- Supabase Realtime requiere habilitar replication en las tablas desde el Dashboard → Database → Replication.
