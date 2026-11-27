-- Operações > Revisão: coluna tbl_linx.detalhes (marcações PMP / OCI / DB / OK dos clientes cancelados).
-- Executar UMA vez no MySQL de produção ANTES de publicar a nova versão no Easypanel.
-- Só cria a coluna se ela ainda não existir (seguro rodar de novo).
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_linx' AND COLUMN_NAME = 'detalhes'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE tbl_linx ADD COLUMN detalhes VARCHAR(100) NULL',
  'SELECT ''tbl_linx.detalhes ja existe'' AS info'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
