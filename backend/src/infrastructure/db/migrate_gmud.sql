-- GMUD (Gestão de Mudanças) — rodar no MySQL ANTES do deploy.
CREATE TABLE IF NOT EXISTS tbl_gmud (
  id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  number                INT UNSIGNED NOT NULL,
  status                VARCHAR(20)  NOT NULL DEFAULT 'open',      -- open | paused | cancelled | completed
  client_cod            INT          NULL,                         -- tbl_linx.cod
  project_name          VARCHAR(255) NOT NULL,
  project_ref           VARCHAR(50)  NULL,
  requester             VARCHAR(150) NULL,
  cnpj                  VARCHAR(20)  NULL,
  linx_contacts         VARCHAR(255) NULL,
  cr                    VARCHAR(150) NULL,
  request_date          DATE         NOT NULL,
  priority              VARCHAR(10)  NOT NULL DEFAULT 'medium',    -- low | medium | high
  change_type           VARCHAR(20)  NOT NULL,                     -- local_infra | cloud_infra | database | linx_dms | connectivity | other
  main_activity         TEXT         NOT NULL,
  reason                TEXT         NULL,
  expected_result       TEXT         NULL,
  estimated_time        VARCHAR(255) NULL,
  additional_factors    TEXT         NULL,
  estimated_costs       VARCHAR(255) NULL,
  release_notes         TEXT         NULL,
  update_process        TEXT         NULL,
  prerequisites         TEXT         NULL,
  impact_client_benefit VARCHAR(500) NULL,
  impact_client_risk    VARCHAR(500) NULL,
  impact_ccm_benefit    VARCHAR(500) NULL,
  impact_ccm_risk       VARCHAR(500) NULL,
  impact_linx_benefit   VARCHAR(500) NULL,
  impact_linx_risk      VARCHAR(500) NULL,
  impact_other_benefit  VARCHAR(500) NULL,
  impact_other_risk     VARCHAR(500) NULL,
  notes                 TEXT         NULL,
  progression           VARCHAR(20)  NOT NULL DEFAULT 'sequential', -- sequential | parallel | partial
  progression_detail    VARCHAR(255) NULL,
  validation_1          VARCHAR(255) NULL,
  validation_2          VARCHAR(255) NULL,
  rollback_plan         TEXT         NULL,
  approver_client       VARCHAR(150) NULL,
  approver_linx         VARCHAR(150) NULL,
  approver_ccm          VARCHAR(150) NULL,
  created_by            INT          NULL,
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gmud_number (number),
  KEY idx_gmud_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opcional: a numeração é MAX(number) + 1. Para a primeira GMUD do sistema sair
-- como 0009 (continuando as feitas em planilha, ex.: GMUD 0008 Linhares), cadastre
-- a primeira normalmente e depois rode:
--   UPDATE tbl_gmud SET number = 9 WHERE number = 1;
