# 🎵 Soundtrack Showdown

Escucha, compara y clasifica en *tiers* las melodías más icónicas de los videojuegos.
Arrastra cada tema, ábrelo en abanico para compararlo con tu ranking actual y decide cuál merece el número uno.

> Proyecto de fans, sin ánimo de lucro. Los temas se reproducen mediante el reproductor incrustado de YouTube; todos los derechos pertenecen a sus respectivos autores y compañías.

## ✨ Características

- **Ranking por arrastre (swipe):** desliza a la derecha para el Top #1, a la izquierda para omitir, o abre el "abanico" para insertar en una posición exacta.
- **Vista previa al comparar:** mantén la carta sobre una posición para escuchar cómo sonaba ese tema antes de colocar el nuevo.
- **Sistema de tiers (S/A/B/C/D):** límites de tier ajustables y persistentes, con reparto automático por defecto.
- **Bloqueo de carta:** fija una carta en el aire para explorar el ranking con calma.
- **Dos modos de juego:** colección completa o solo los clásicos imprescindibles.
- **Sesiones reanudables y compartibles:** cada ranking tiene un ID; comparte la URL o continúa donde lo dejaste.
- **Tutorial interactivo** integrado.
- **Persistencia en la nube** con Supabase.

## 🛠️ Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) como bundler
- [Tailwind CSS](https://tailwindcss.com/) para estilos
- [@dnd-kit](https://dndkit.com/) para reordenar la lista
- [lucide-react](https://lucide.dev/) para iconos
- [Supabase](https://supabase.com/) (Postgres) para sesiones y rankings
- Reproductor incrustado de YouTube (IFrame API)

## 🚀 Puesta en marcha

### Requisitos
- Node.js 18+ y npm
- Un proyecto de [Supabase](https://supabase.com/)

### Instalación

```bash
# 1. Instala dependencias
npm install

# 2. Configura las variables de entorno
cp .env.example .env
# Edita .env con la URL y la anon key de tu proyecto Supabase

# 3. Arranca el servidor de desarrollo
npm run dev
```

### Base de datos

Las tablas (`songs`, `ranking_sessions`, `ranked_songs`, `excluded_songs`) y los datos
iniciales se crean con las migraciones de `supabase/migrations/`. Aplícalas con la
[CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

> ⚠️ **Seguridad — léelo antes de desplegar.** La clave `anon` es pública (viaja en el
> bundle del cliente), así que la protección real de tus datos depende de las
> **políticas RLS (Row Level Security)** de Supabase. Asegúrate de:
> - Activar RLS en todas las tablas.
> - Dar acceso de **solo lectura** a `songs`.
> - Restringir escrituras de `ranking_sessions` / `ranked_songs` / `excluded_songs`
>   a su propia sesión.
>
> La Edge Function `supabase/functions/seed-songs` borra y reinserta toda la tabla
> `songs`: **no la despliegues sin protegerla con autenticación**, o úsala solo en local.

## 🌐 Despliegue en GitHub Pages

El repo incluye un workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))
que compila y publica automáticamente en cada push a `main`. Pasos (solo una vez):

1. **Sube el repo a GitHub** (ver más abajo).
2. **Añade las credenciales de Supabase** como *secrets*:
   `Settings → Secrets and variables → Actions → New repository secret`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Activa Pages:** `Settings → Pages → Build and deployment → Source: GitHub Actions`.
4. Haz `git push`. Al terminar el workflow, la app estará en
   `https://<usuario>.github.io/<repo>/`.

> El `base` se ajusta solo al nombre del repositorio. Si usas un repo
> `<usuario>.github.io` (Pages de usuario, en la raíz), no necesitas subruta:
> el `base` por defecto ya es `/`.

## 📜 Scripts

| Comando             | Descripción                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                       |
| `npm run build`     | Compila para producción en `dist/`           |
| `npm run preview`   | Sirve el build de producción localmente      |
| `npm run lint`      | Linter (ESLint)                              |

### Mantenimiento del catálogo

Como los temas se sirven desde YouTube, algún vídeo puede caerse o estar mal
asignado. Dos herramientas (sin API key) ayudan a mantenerlo sano:

```bash
node scripts/check-songs.mjs    # audita disponibilidad y detecta posibles errores
node scripts/suggest-fixes.mjs  # propone reemplazos verificados -> fix-songs.sql
```

`fix-songs.sql` contiene `UPDATE`s listos para revisar y ejecutar en el
**SQL Editor** de Supabase (las escrituras a `songs` requieren rol privilegiado).
| `npm run typecheck` | Comprobación de tipos (TypeScript)           |

## 📁 Estructura

```
src/
├── components/   # HomeScreen, RankingView, SongCard, RankingPanel, ResultsScreen, YouTubePlayer
├── lib/          # api.ts, supabase.ts, gameModes.ts, tierUtils.ts
├── App.tsx
└── main.tsx
supabase/
├── migrations/   # esquema + datos iniciales
└── functions/    # Edge Functions
```

## 📄 Licencia

MIT — ver el campo `license` en `package.json`.
