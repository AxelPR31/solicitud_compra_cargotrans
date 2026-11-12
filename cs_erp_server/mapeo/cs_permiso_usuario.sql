USE [CS_MS]
GO

/****** Permisos: ADMIN, REGISTRAR_SOLICITUD, APROBAR_SOLICITUD, APROBAR_OC (esquema POSCS) ******/
/****** USUARIO debe ser varchar(25) igual que [ERPADMIN].[USUARIO].[USUARIO] ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

DECLARE @Schema SYSNAME = N'POSCS';

IF NOT EXISTS (
  SELECT 1 FROM sys.tables t
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = @Schema AND t.name = N'CS_PERMISO_USUARIO'
)
BEGIN
  DECLARE @sql NVARCHAR(MAX) = N'
  CREATE TABLE [' + @Schema + N'].[CS_PERMISO_USUARIO] (
    [USUARIO] [varchar](25) NOT NULL,
    [PERMISO] [varchar](40) NOT NULL,
    [ACTIVO] [bit] NOT NULL CONSTRAINT [DF_CS_PERMISO_ACTIVO] DEFAULT ((1)),
    [CreateDate] [datetime] NOT NULL CONSTRAINT [DF_CS_PERMISO_FCRE] DEFAULT (GETDATE()),
    CONSTRAINT [PK_CS_PERMISO_USUARIO] PRIMARY KEY CLUSTERED (
      [USUARIO] ASC,
      [PERMISO] ASC
    ),
    CONSTRAINT [FK_CS_PERMISO_USUARIO] FOREIGN KEY([USUARIO])
      REFERENCES [ERPADMIN].[USUARIO] ([USUARIO])
  );';
  EXEC sp_executesql @sql;
END
GO

DECLARE @Schema SYSNAME = N'POSCS';

/* Corrección si la tabla se creó antes con varchar(50) y sin FK */
DECLARE @fixLen NVARCHAR(MAX) = N'
DECLARE @tbl SYSNAME = N''CS_PERMISO_USUARIO'';
DECLARE @sch SYSNAME = N''' + @Schema + N''';
IF EXISTS (
  SELECT 1 FROM sys.tables t
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = @sch AND t.name = @tbl
)
AND EXISTS (
  SELECT 1 FROM sys.columns c
  INNER JOIN sys.tables t ON c.object_id = t.object_id
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = @sch AND t.name = @tbl AND c.name = N''USUARIO''
    AND c.max_length <> 25
)
BEGIN
  IF EXISTS (
    SELECT 1 FROM sys.foreign_keys fk
    INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    WHERE s.name = @sch AND t.name = @tbl AND fk.name = N''FK_CS_PERMISO_USUARIO''
  )
    EXEC(''ALTER TABLE [' + @Schema + N'].[CS_PERMISO_USUARIO] DROP CONSTRAINT [FK_CS_PERMISO_USUARIO]'');
  ALTER TABLE [' + @Schema + N'].[CS_PERMISO_USUARIO]
    ALTER COLUMN [USUARIO] [varchar](25) NOT NULL;
END';
EXEC sp_executesql @fixLen;
GO

DECLARE @Schema SYSNAME = N'POSCS';

DECLARE @addFk NVARCHAR(MAX) = N'
IF EXISTS (
  SELECT 1 FROM sys.tables t
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = N''' + @Schema + N''' AND t.name = N''CS_PERMISO_USUARIO''
)
AND NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys fk
  INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = N''' + @Schema + N''' AND t.name = N''CS_PERMISO_USUARIO''
    AND fk.name = N''FK_CS_PERMISO_USUARIO''
)
  ALTER TABLE [' + @Schema + N'].[CS_PERMISO_USUARIO] WITH CHECK ADD
    CONSTRAINT [FK_CS_PERMISO_USUARIO] FOREIGN KEY ([USUARIO])
    REFERENCES [ERPADMIN].[USUARIO] ([USUARIO]);';
EXEC sp_executesql @addFk;
GO

DECLARE @Schema SYSNAME = N'POSCS';

DECLARE @seed NVARCHAR(MAX) = N'
IF NOT EXISTS (
  SELECT 1 FROM [' + @Schema + N'].[CS_PERMISO_USUARIO]
  WHERE [USUARIO] = ''ERPADMIN'' AND [PERMISO] = ''ADMIN''
)
  INSERT INTO [' + @Schema + N'].[CS_PERMISO_USUARIO] ([USUARIO], [PERMISO], [ACTIVO])
  VALUES (''ERPADMIN'', ''ADMIN'', 1);
IF NOT EXISTS (
  SELECT 1 FROM [' + @Schema + N'].[CS_PERMISO_USUARIO]
  WHERE [USUARIO] = ''ERPADMIN'' AND [PERMISO] = ''REGISTRAR_SOLICITUD''
)
  INSERT INTO [' + @Schema + N'].[CS_PERMISO_USUARIO] ([USUARIO], [PERMISO], [ACTIVO])
  VALUES (''ERPADMIN'', ''REGISTRAR_SOLICITUD'', 1);
IF NOT EXISTS (
  SELECT 1 FROM [' + @Schema + N'].[CS_PERMISO_USUARIO]
  WHERE [USUARIO] = ''ERPADMIN'' AND [PERMISO] = ''APROBAR_SOLICITUD''
)
  INSERT INTO [' + @Schema + N'].[CS_PERMISO_USUARIO] ([USUARIO], [PERMISO], [ACTIVO])
  VALUES (''ERPADMIN'', ''APROBAR_SOLICITUD'', 1);
IF NOT EXISTS (
  SELECT 1 FROM [' + @Schema + N'].[CS_PERMISO_USUARIO]
  WHERE [USUARIO] = ''ERPADMIN'' AND [PERMISO] = ''APROBAR_OC''
)
  INSERT INTO [' + @Schema + N'].[CS_PERMISO_USUARIO] ([USUARIO], [PERMISO], [ACTIVO])
  VALUES (''ERPADMIN'', ''APROBAR_OC'', 1);
/* Quien tiene ADMIN activo: asegurar permisos de operación */
INSERT INTO [' + @Schema + N'].[CS_PERMISO_USUARIO] ([USUARIO], [PERMISO], [ACTIVO])
SELECT DISTINCT LTRIM(RTRIM(a.[USUARIO])), p.[PERMISO], 1
FROM [' + @Schema + N'].[CS_PERMISO_USUARIO] a
CROSS JOIN (VALUES (''REGISTRAR_SOLICITUD''), (''APROBAR_SOLICITUD''), (''APROBAR_OC'')) AS p([PERMISO])
WHERE a.[PERMISO] = ''ADMIN'' AND a.[ACTIVO] = 1
  AND NOT EXISTS (
    SELECT 1 FROM [' + @Schema + N'].[CS_PERMISO_USUARIO] o
    WHERE o.[USUARIO] = a.[USUARIO] AND o.[PERMISO] = p.[PERMISO]
  );';
EXEC sp_executesql @seed;
GO
