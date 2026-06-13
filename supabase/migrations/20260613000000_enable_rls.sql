-- ============================================================================
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
-- La app es ANÓNIMA (sin login): el navegador usa la clave `anon`, que es
-- pública. Por eso el `session_id` aleatorio funciona como una "capability":
-- quien conoce un session_id (p. ej. mediante la URL compartida) puede ver y
-- editar ese ranking. Eso es intencional (compartir la URL = compartir la lista).
--
-- Objetivo de estas políticas:
--   * Bloquear toda escritura del catálogo `songs` desde el cliente
--     (solo lectura). El seeding se hace por migración o con la service_role key.
--   * Permitir a `anon` exactamente las operaciones que la app necesita sobre
--     las tablas de sesión, y nada más (privilegio mínimo por comando).
--
-- Limitación conocida: sin autenticación no es posible impedir por RLS que un
-- actor malicioso lea/modifique filas de sesiones ajenas. Para privacidad real
-- habría que mover las escrituras a Edge Functions con service_role + login.
-- ============================================================================

-- ── songs: solo lectura pública ─────────────────────────────────────────────
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "songs_select_public" ON public.songs;
CREATE POLICY "songs_select_public"
  ON public.songs FOR SELECT
  TO anon, authenticated
  USING (true);
-- Sin políticas de INSERT/UPDATE/DELETE => denegadas para anon/authenticated.
-- (Solo la service_role, que ignora RLS, puede modificar el catálogo.)


-- ── ranking_sessions: crear, leer y actualizar (sin borrar) ─────────────────
ALTER TABLE public.ranking_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select" ON public.ranking_sessions;
CREATE POLICY "sessions_select"
  ON public.ranking_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "sessions_insert" ON public.ranking_sessions;
CREATE POLICY "sessions_insert"
  ON public.ranking_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL);

DROP POLICY IF EXISTS "sessions_update" ON public.ranking_sessions;
CREATE POLICY "sessions_update"
  ON public.ranking_sessions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ── ranked_songs: leer, insertar y actualizar (upsert; sin borrar) ──────────
ALTER TABLE public.ranked_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranked_select" ON public.ranked_songs;
CREATE POLICY "ranked_select"
  ON public.ranked_songs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "ranked_insert" ON public.ranked_songs;
CREATE POLICY "ranked_insert"
  ON public.ranked_songs FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL);

DROP POLICY IF EXISTS "ranked_update" ON public.ranked_songs;
CREATE POLICY "ranked_update"
  ON public.ranked_songs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ── excluded_songs: leer, insertar y borrar (sin actualizar) ────────────────
ALTER TABLE public.excluded_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "excluded_select" ON public.excluded_songs;
CREATE POLICY "excluded_select"
  ON public.excluded_songs FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "excluded_insert" ON public.excluded_songs;
CREATE POLICY "excluded_insert"
  ON public.excluded_songs FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL);

DROP POLICY IF EXISTS "excluded_delete" ON public.excluded_songs;
CREATE POLICY "excluded_delete"
  ON public.excluded_songs FOR DELETE
  TO anon, authenticated
  USING (true);
