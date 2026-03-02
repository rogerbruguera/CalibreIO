-- 1. Accelerar les cerques en size_controls per filtre de camp i data
CREATE INDEX IF NOT EXISTS idx_size_controls_field_id ON size_controls (field_id);
CREATE INDEX IF NOT EXISTS idx_size_controls_date ON size_controls (date DESC);

-- 2. Índex compost de varietat al camp per al recompte ràpid del Dashboard
CREATE INDEX IF NOT EXISTS idx_fields_variety ON fields (variety);

-- 3. Índex de seguretat RLS manual (bàsic per quant l'usuari només demana les seves dades)
CREATE INDEX IF NOT EXISTS idx_size_controls_user_id ON size_controls (user_id);
CREATE INDEX IF NOT EXISTS idx_fields_user_id ON fields (user_id);
