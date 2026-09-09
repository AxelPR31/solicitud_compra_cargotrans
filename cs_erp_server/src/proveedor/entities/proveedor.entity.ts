import { Entity, Column, PrimaryColumn } from 'typeorm';
import { IsNotEmpty, IsString, IsNumber, IsDate } from 'class-validator';

@Entity({ name: 'PROVEEDOR', synchronize: false })
export class Proveedor {
  @PrimaryColumn({ length: 20 })
  @IsNotEmpty()
  @IsString()
  PROVEEDOR: string;

  @Column({ length: 150 })
  @IsNotEmpty()
  @IsString()
  NOMBRE: string;

  @Column({ length: 30 })
  @IsNotEmpty()
  @IsString()
  CONTACTO: string;

  @Column({ length: 30 })
  @IsNotEmpty()
  @IsString()
  CARGO: string;

  @Column('text')
  @IsNotEmpty()
  @IsString()
  DIRECCION: string;

  @Column('datetime')
  @IsNotEmpty()
  @IsDate()
  FECHA_INGRESO: Date;

  @Column('datetime')
  @IsNotEmpty()
  @IsDate()
  FECHA_ULT_MOV: Date;

  @Column({ length: 50 })
  @IsNotEmpty()
  @IsString()
  TELEFONO1: string;

  @Column({ length: 50 })
  @IsNotEmpty()
  @IsString()
  TELEFONO2: string;

  @Column({ length: 50 })
  @IsNotEmpty()
  @IsString()
  FAX: string;

  @Column('decimal', { precision: 28, scale: 8 })
  @IsNotEmpty()
  @IsNumber()
  ORDEN_MINIMA: number;

  @Column('decimal', { precision: 28, scale: 8 })
  @IsNotEmpty()
  @IsNumber()
  DESCUENTO: number;

  @Column({ length: 1 })
  @IsNotEmpty()
  @IsString()
  LOCAL: string;

  @Column({ length: 1 })
  @IsNotEmpty()
  @IsString()
  CONGELADO: string;

  @Column({ length: 20 })
  @IsNotEmpty()
  @IsString()
  CONTRIBUYENTE: string;

  @Column({ length: 4 })
  @IsNotEmpty()
  @IsString()
  CONDICION_PAGO: string;

  @Column({ length: 4 })
  @IsNotEmpty()
  @IsString()
  MONEDA: string;

  @Column({ length: 4 })
  @IsNotEmpty()
  @IsString()
  PAIS: string;

  @Column({ length: 8 })
  @IsNotEmpty()
  @IsString()
  CATEGORIA_PROVEED: string;

  @Column({ length: 1 })
  @IsNotEmpty()
  @IsString()
  MULTIMONEDA: string;

  @Column('decimal', { precision: 28, scale: 8 })
  @IsNotEmpty()
  @IsNumber()
  SALDO: number;

  @Column('decimal', { precision: 28, scale: 8 })
  @IsNotEmpty()
  @IsNumber()
  SALDO_LOCAL: number;

  @Column('decimal', { precision: 28, scale: 8 })
  @IsNotEmpty()
  @IsNumber()
  SALDO_DOLAR: number;

  @Column({ length: 1 })
  @IsNotEmpty()
  @IsString()
  ACTIVO: string;

  @Column({ length: 4, nullable: true })
  @IsString()
  CODIGO_IMPUESTO: string;

  @Column({ length: 1 })
  @IsNotEmpty()
  @IsString()
  AUTORETENEDOR: string;
}
