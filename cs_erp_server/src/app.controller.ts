import { Controller, Get, Param, HttpCode } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('favicon.ico')
  @HttpCode(204)
  getFavicon() {
    // Retorna 204 No Content para evitar logs molestos de 404 por favicon en navegadores
  }

  @Get('/greet/:name')
  getGreet(@Param('name') name: string): string {
    return `Hello ${name}!`
  }
}
