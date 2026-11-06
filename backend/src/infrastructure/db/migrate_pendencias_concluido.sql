-- Gestão > Tarefas (Kanban): novo status "concluido" em tbl_pendencias (card arquivado).
-- Executar UMA vez no MySQL de produção ANTES de publicar a nova versão no Easypanel.
-- Coluna original (06/11/2026): enum('aberto','em_andamento','impedimento','resolvido') NOT NULL DEFAULT 'aberto'.
ALTER TABLE tbl_pendencias
  MODIFY COLUMN status ENUM('aberto','em_andamento','impedimento','resolvido','concluido')
  NOT NULL DEFAULT 'aberto';
