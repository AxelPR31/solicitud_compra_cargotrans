import './load-env'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ArgumentsHost, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import constants from './core/constants'

const { SERVER_PORT } = constants

const EXAMPLE_HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
] as const

const buildScalarExample = (name: string, type?: string) => {
  const normalizedName = name.toLowerCase()

  if (type === 'number' || normalizedName.includes('id')) {
    return 1
  }

  if (type === 'boolean') {
    return true
  }

  if (normalizedName.includes('fecha') || normalizedName.includes('date')) {
    return '2026-01-01T00:00:00.000Z'
  }

  return `example_${name}`
}

const injectSwaggerExamples = (document: any) => {
  for (const [path, pathItem] of Object.entries<any>(document.paths ?? {})) {
    for (const method of EXAMPLE_HTTP_METHODS) {
      const operation = pathItem?.[method]
      if (!operation) continue

      for (const parameter of operation.parameters ?? []) {
        parameter.schema = parameter.schema ?? {}
        if (parameter.schema.example !== undefined) continue
        parameter.schema.example = buildScalarExample(
          parameter.name,
          parameter.schema.type,
        )
      }

      if (
        operation.requestBody &&
        ['post', 'put', 'patch'].includes(method) &&
        operation.requestBody.content?.['application/json']
      ) {
        const jsonContent = operation.requestBody.content['application/json']
        if (
          jsonContent.example === undefined &&
          jsonContent.examples === undefined
        ) {
          jsonContent.example = {
            note: `Example payload for ${method.toUpperCase()} ${path}`,
          }
        }
      }

      operation.responses = operation.responses ?? {}
      const defaultStatus = method === 'post' ? '201' : '200'
      operation.responses[defaultStatus] = operation.responses[
        defaultStatus
      ] ?? { description: 'Successful response' }

      const successResponse = operation.responses[defaultStatus]
      successResponse.content = successResponse.content ?? {}
      successResponse.content['application/json'] =
        successResponse.content['application/json'] ?? {}

      const responseJson = successResponse.content['application/json']
      if (
        responseJson.example === undefined &&
        responseJson.examples === undefined
      ) {
        responseJson.example = {
          message: 'Example successful response',
          method: method.toUpperCase(),
          path,
        }
      }
    }
  }
}

const organizeSwaggerByResource = (document: any) => {
  const tags = new Set<string>()

  for (const [path, pathItem] of Object.entries<any>(document.paths ?? {})) {
    const resource = path.split('/').filter(Boolean)[0] ?? 'root'
    tags.add(resource)

    for (const method of EXAMPLE_HTTP_METHODS) {
      const operation = pathItem?.[method]
      if (!operation) continue
      operation.tags = [resource]
    }
  }

  document.tags = Array.from(tags)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name }))
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
app.enableCors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://18.191.192.80:3000',
    'http://localhost:7500',
    'http://18.191.192.80:7500',
     'https://localhost:3000',
  ],
  credentials: true,
})
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.useGlobalFilters(
    new (class {
      catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const res = ctx.getResponse()

        if (exception instanceof HttpException) {
          const status = exception.getStatus()
          const body = exception.getResponse()
          console.error(`HTTP ${status}:`, body)
          return res.status(status).json(
            typeof body === 'string' ? { message: body, statusCode: status } : body,
          )
        }

        const message =
          exception instanceof Error ? exception.message : 'Error interno del servidor'
        console.error('Unhandled exception:', exception)
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message,
        })
      }
    })(),
  )
  app.use(cookieParser())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CS ERP API')
    .setDescription('Documentacion de endpoints del servidor CS ERP')
    .setVersion('1.0')
    .build()

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    deepScanRoutes: true,
  })
  organizeSwaggerByResource(swaggerDocument)
  injectSwaggerExamples(swaggerDocument)
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'CS ERP API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  })

  // console.log('PORT ', SERVER_PORT)
  // console.log(`Swagger docs: http://localhost:${SERVER_PORT}/docs`)
  await app.listen(SERVER_PORT)
}

bootstrap()
