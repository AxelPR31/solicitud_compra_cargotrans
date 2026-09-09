import { Injectable } from '@nestjs/common'
import { Express } from 'express'
import { Multer } from 'multer'
import { DataSource } from 'typeorm'

@Injectable()
export class UploadService {
  // Guardar metadata del archivo en la base de datos del tenant
  async saveFileMetadata(
    tenantConnection: DataSource,
    file: Express.Multer.File,
  ) {
    // Aquí puedes usar tenantConnection para interactuar con las entidades del tenant
    const queryRunner = tenantConnection.createQueryRunner()

    try {
      await queryRunner.startTransaction()

      // Suponiendo que tienes una entidad FileMetadata para almacenar información del archivo
      await queryRunner.manager.save('FileMetadata', {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadDate: new Date(),
      })

      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }

    return { success: true }
  }
}
