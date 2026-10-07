-- Daily — Pendências: novo campo "Data Limite" (opcional)
-- Executar UMA vez no MySQL de produção ANTES de publicar a nova versão no Easypanel.
ALTER TABLE tbl_pendencias
  ADD COLUMN data_limite DATE NULL DEFAULT NULL AFTER data;
