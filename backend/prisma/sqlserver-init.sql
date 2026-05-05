/*
  SQL Server bootstrap script for portaria-app-ceslog.
  Target: clean database (new environment).
  Namespace strategy:
  - Schema: portaria
  - Table prefix: portaria_
*/

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'portaria')
BEGIN
  EXEC(N'CREATE SCHEMA portaria');
END
GO

IF OBJECT_ID(N'portaria.portaria_tenants', N'U') IS NULL
BEGIN
  CREATE TABLE portaria.portaria_tenants (
    id INT IDENTITY(1,1) NOT NULL,
    slug NVARCHAR(120) NOT NULL,
    nome NVARCHAR(200) NOT NULL,
    ativo BIT NOT NULL CONSTRAINT DF_portaria_tenants_ativo DEFAULT (1),
    criadoEm DATETIME2(3) NOT NULL CONSTRAINT DF_portaria_tenants_criadoEm DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_portaria_tenants PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_portaria_tenants_slug UNIQUE (slug)
  );
END
GO

IF OBJECT_ID(N'portaria.portaria_usuarios', N'U') IS NULL
BEGIN
  CREATE TABLE portaria.portaria_usuarios (
    id INT IDENTITY(1,1) NOT NULL,
    nome NVARCHAR(200) NOT NULL,
    email NVARCHAR(320) NULL,
    senhaHash NVARCHAR(255) NOT NULL,
    perfil NVARCHAR(20) NOT NULL,
    ativo BIT NOT NULL CONSTRAINT DF_portaria_usuarios_ativo DEFAULT (1),
    criadoEm DATETIME2(3) NOT NULL CONSTRAINT DF_portaria_usuarios_criadoEm DEFAULT (SYSUTCDATETIME()),
    usuario NVARCHAR(100) NOT NULL,
    turno NVARCHAR(20) NULL,
    tenantId INT NOT NULL,
    CONSTRAINT PK_portaria_usuarios PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_portaria_usuarios_tenantId
      FOREIGN KEY (tenantId) REFERENCES portaria.portaria_tenants(id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
    CONSTRAINT CK_portaria_usuarios_perfil
      CHECK (perfil IN (N'ADMIN', N'OPERADOR')),
    CONSTRAINT CK_portaria_usuarios_turno
      CHECK (turno IS NULL OR turno IN (N'MANHA', N'TARDE'))
  );
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UQ_portaria_usuarios_usuario'
    AND object_id = OBJECT_ID(N'portaria.portaria_usuarios')
)
BEGIN
  CREATE UNIQUE INDEX UQ_portaria_usuarios_usuario ON portaria.portaria_usuarios(usuario);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UQ_portaria_usuarios_email_not_null'
    AND object_id = OBJECT_ID(N'portaria.portaria_usuarios')
)
BEGIN
  CREATE UNIQUE INDEX UQ_portaria_usuarios_email_not_null
    ON portaria.portaria_usuarios(email)
    WHERE email IS NOT NULL;
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_usuarios_tenant_perfil_ativo'
    AND object_id = OBJECT_ID(N'portaria.portaria_usuarios')
)
BEGIN
  CREATE INDEX IX_portaria_usuarios_tenant_perfil_ativo
    ON portaria.portaria_usuarios(tenantId, perfil, ativo);
END
GO

IF OBJECT_ID(N'portaria.portaria_relatorios', N'U') IS NULL
BEGIN
  CREATE TABLE portaria.portaria_relatorios (
    id INT IDENTITY(1,1) NOT NULL,
    dataRelatorio DATE NOT NULL,
    status NVARCHAR(20) NOT NULL CONSTRAINT DF_portaria_relatorios_status DEFAULT (N'ABERTO'),
    criadoEm DATETIME2(3) NOT NULL CONSTRAINT DF_portaria_relatorios_criadoEm DEFAULT (SYSUTCDATETIME()),
    finalizadoEm DATETIME2(3) NULL,
    tenantId INT NOT NULL,
    CONSTRAINT PK_portaria_relatorios PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_portaria_relatorios_tenantId
      FOREIGN KEY (tenantId) REFERENCES portaria.portaria_tenants(id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
    CONSTRAINT CK_portaria_relatorios_status
      CHECK (status IN (N'ABERTO', N'FECHADO'))
  );
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UQ_portaria_relatorios_tenant_data'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorios')
)
BEGIN
  CREATE UNIQUE INDEX UQ_portaria_relatorios_tenant_data
    ON portaria.portaria_relatorios(tenantId, dataRelatorio);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorios_tenant_status_data'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorios')
)
BEGIN
  CREATE INDEX IX_portaria_relatorios_tenant_status_data
    ON portaria.portaria_relatorios(tenantId, status, dataRelatorio);
END
GO

IF OBJECT_ID(N'portaria.portaria_relatorio_itens', N'U') IS NULL
BEGIN
  CREATE TABLE portaria.portaria_relatorio_itens (
    id INT IDENTITY(1,1) NOT NULL,
    relatorioId INT NOT NULL,
    usuarioId INT NOT NULL,
    empresa NVARCHAR(200) NOT NULL,
    placaVeiculo NVARCHAR(20) NOT NULL,
    nome NVARCHAR(200) NOT NULL,
    horaEntrada NVARCHAR(10) NULL,
    horaSaida NVARCHAR(10) NULL,
    observacoes NVARCHAR(MAX) NULL,
    turno NVARCHAR(20) NULL,
    criadoEm DATETIME2(3) NOT NULL CONSTRAINT DF_portaria_relatorio_itens_criadoEm DEFAULT (SYSUTCDATETIME()),
    perfilPessoa NVARCHAR(20) NOT NULL CONSTRAINT DF_portaria_relatorio_itens_perfilPessoa DEFAULT (N'VISITANTE'),
    tenantId INT NOT NULL,
    CONSTRAINT PK_portaria_relatorio_itens PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_portaria_relatorio_itens_relatorioId
      FOREIGN KEY (relatorioId) REFERENCES portaria.portaria_relatorios(id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
    CONSTRAINT FK_portaria_relatorio_itens_usuarioId
      FOREIGN KEY (usuarioId) REFERENCES portaria.portaria_usuarios(id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
    CONSTRAINT FK_portaria_relatorio_itens_tenantId
      FOREIGN KEY (tenantId) REFERENCES portaria.portaria_tenants(id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
    CONSTRAINT CK_portaria_relatorio_itens_perfilPessoa
      CHECK (
        perfilPessoa IN (
          N'VISITANTE',
          N'FORNECEDOR',
          N'PRESTADOR',
          N'PARCEIRO',
          N'COLABORADOR',
          N'AGREGADO'
        )
      )
  );
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorio_itens_tenant_relatorio'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorio_itens')
)
BEGIN
  CREATE INDEX IX_portaria_relatorio_itens_tenant_relatorio
    ON portaria.portaria_relatorio_itens(tenantId, relatorioId);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorio_itens_tenant_usuario'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorio_itens')
)
BEGIN
  CREATE INDEX IX_portaria_relatorio_itens_tenant_usuario
    ON portaria.portaria_relatorio_itens(tenantId, usuarioId);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorio_itens_tenant_relatorio_criado'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorio_itens')
)
BEGIN
  CREATE INDEX IX_portaria_relatorio_itens_tenant_relatorio_criado
    ON portaria.portaria_relatorio_itens(tenantId, relatorioId, criadoEm);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorio_itens_tenant_usuario_criado'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorio_itens')
)
BEGIN
  CREATE INDEX IX_portaria_relatorio_itens_tenant_usuario_criado
    ON portaria.portaria_relatorio_itens(tenantId, usuarioId, criadoEm);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorio_itens_tenant_placa'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorio_itens')
)
BEGIN
  CREATE INDEX IX_portaria_relatorio_itens_tenant_placa
    ON portaria.portaria_relatorio_itens(tenantId, placaVeiculo);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_relatorio_itens_tenant_nome'
    AND object_id = OBJECT_ID(N'portaria.portaria_relatorio_itens')
)
BEGIN
  CREATE INDEX IX_portaria_relatorio_itens_tenant_nome
    ON portaria.portaria_relatorio_itens(tenantId, nome);
END
GO

IF OBJECT_ID(N'portaria.portaria_audit_logs', N'U') IS NULL
BEGIN
  CREATE TABLE portaria.portaria_audit_logs (
    id INT IDENTITY(1,1) NOT NULL,
    usuario_id INT NULL,
    usuario_nome NVARCHAR(200) NULL,
    usuario_login NVARCHAR(100) NULL,
    acao NVARCHAR(100) NOT NULL,
    entidade NVARCHAR(100) NOT NULL,
    entidade_id INT NULL,
    descricao NVARCHAR(MAX) NOT NULL,
    detalhes NVARCHAR(MAX) NULL,
    ip NVARCHAR(64) NULL,
    user_agent NVARCHAR(1024) NULL,
    request_id NVARCHAR(120) NULL,
    criado_em DATETIME2(3) NOT NULL CONSTRAINT DF_portaria_audit_logs_criado_em DEFAULT (SYSUTCDATETIME()),
    tenantId INT NOT NULL,
    CONSTRAINT PK_portaria_audit_logs PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_portaria_audit_logs_usuario_id
      FOREIGN KEY (usuario_id) REFERENCES portaria.portaria_usuarios(id)
      ON UPDATE NO ACTION
      ON DELETE SET NULL,
    CONSTRAINT FK_portaria_audit_logs_tenantId
      FOREIGN KEY (tenantId) REFERENCES portaria.portaria_tenants(id)
      ON UPDATE NO ACTION
      ON DELETE NO ACTION,
    CONSTRAINT CK_portaria_audit_logs_detalhes_json
      CHECK (detalhes IS NULL OR ISJSON(detalhes) = 1)
  );
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_audit_logs_tenant_usuario'
    AND object_id = OBJECT_ID(N'portaria.portaria_audit_logs')
)
BEGIN
  CREATE INDEX IX_portaria_audit_logs_tenant_usuario
    ON portaria.portaria_audit_logs(tenantId, usuario_id);
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'IX_portaria_audit_logs_tenant_criado'
    AND object_id = OBJECT_ID(N'portaria.portaria_audit_logs')
)
BEGIN
  CREATE INDEX IX_portaria_audit_logs_tenant_criado
    ON portaria.portaria_audit_logs(tenantId, criado_em DESC);
END
GO

IF OBJECT_ID(N'portaria.portaria_auth_sessions', N'U') IS NULL
BEGIN
  CREATE TABLE portaria.portaria_auth_sessions (
    usuario_id INT NOT NULL,
    session_id NVARCHAR(64) NOT NULL,
    atualizado_em DATETIME2(3) NOT NULL CONSTRAINT DF_portaria_auth_sessions_atualizado_em DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_portaria_auth_sessions PRIMARY KEY CLUSTERED (usuario_id),
    CONSTRAINT FK_portaria_auth_sessions_usuario_id
      FOREIGN KEY (usuario_id) REFERENCES portaria.portaria_usuarios(id)
      ON UPDATE NO ACTION
      ON DELETE CASCADE
  );
END
GO

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes
  WHERE name = N'UQ_portaria_auth_sessions_session_id'
    AND object_id = OBJECT_ID(N'portaria.portaria_auth_sessions')
)
BEGIN
  CREATE UNIQUE INDEX UQ_portaria_auth_sessions_session_id ON portaria.portaria_auth_sessions(session_id);
END
GO
