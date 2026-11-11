import { Module } from '@nestjs/common'
import { CsSchemaBootstrapService } from './cs-schema-bootstrap.service'

@Module({
  providers: [CsSchemaBootstrapService],
})
export class CsDatabaseModule {}
