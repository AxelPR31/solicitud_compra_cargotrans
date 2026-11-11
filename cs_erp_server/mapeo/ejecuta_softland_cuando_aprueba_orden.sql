declare @p1 int
set @p1=2283
exec sp_prepexec @p1 output,N'@P1 float,@P2 varchar(20),@P3 varchar(4),@P4 datetime,@P5 varchar(20)',N' UPDATE POSCS.articulo_compra SET  ult_prec_unitario = @P1           ,  ult_proveedor = @P2              ,  ult_moneda = @P3           ,  ult_fecha_cotiza = @P4             WHERE articulo = @P5         ',1000,'AWS','DOL','2026-11-11 00:00:00','AC0002'
select @p1


declare @p1 int
set @p1=2270
exec sp_prepexec @p1 output,N'@P1 varchar(10),@P2 datetime',N'  INSERT INTO	POSCS.usuarios_aprob_oc (orden_compra, usuario, fecha_aprob)  VALUES ( @P1             , ''ERPADMIN'', @P2               ) ','OC00000009','2026-11-11 10:05:44.047'
select @p1

declare @p1 int
set @p1=2275
exec sp_prepexec @p1 output,N'@P1 float',N'UPDATE POSCS.existencia_bodega  SET cant_transito = cant_transito + @P1              WHERE bodega = ''1'' AND articulo = ''AC0002''',1
select @p1

declare @p1 int
set @p1=2276
exec sp_prepexec @p1 output,N'@P1 varchar(1),@P2 varchar(50),@P3 datetime',N'UPDATE POSCS.orden_compra   SET	confirmada = @P1          ,   	usuario_confirma = @P2           ,  	fecha_hora_confir = @P3            WHERE  orden_compra = ''OC00000009''','S','ERPADMIN','2026-11-11 10:05:43.930'
select @p1