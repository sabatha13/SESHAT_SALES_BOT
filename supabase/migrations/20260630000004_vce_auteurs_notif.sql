-- ============================================================
-- Migration: 20260630000004_vce_auteurs_notif.sql
-- Sprint 3 — Préférences de notification auteur VCE
-- email + whatsapp activés par défaut, telegram désactivé
-- ============================================================

ALTER TABLE vce_auteurs
  ADD COLUMN notif_email BOOLEAN DEFAULT true;

ALTER TABLE vce_auteurs
  ADD COLUMN notif_whatsapp BOOLEAN DEFAULT true;

ALTER TABLE vce_auteurs
  ADD COLUMN notif_telegram BOOLEAN DEFAULT false;
