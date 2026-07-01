CREATE TABLE vce_login_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index pour les requêtes de comptage par IP + fenêtre de temps
CREATE INDEX idx_vce_login_attempts_ip_created ON vce_login_attempts(ip, created_at);

-- RLS : accès service_role uniquement, jamais exposé côté client
ALTER TABLE vce_login_attempts ENABLE ROW LEVEL SECURITY;
-- Aucune policy publique : service_role bypass RLS par défaut
