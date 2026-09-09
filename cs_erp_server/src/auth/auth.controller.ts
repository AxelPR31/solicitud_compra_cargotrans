import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common'
import { SignInDto } from './dtos/signin.dto'
import { AuthService } from './auth.service'
import { Response } from 'express'
import constants from 'src/core/constants'
import { User } from 'src/core/decorators/user.decorator'
import { AuthGuard } from 'src/core/guards/auth.guard'
import { UserPrincipal } from './types/user-principal'
import { Public } from 'src/core/decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('/signin')
  @Public()
  async signin(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this._authService.signin(body)

    res.cookie(constants.AUTH_KEY, `Bearer ${response.token}`, {
      httpOnly: true,
      secure: constants.__prod__,
      sameSite: 'lax', // 🔥 importante
    })

    return response.user
  }

  @UseGuards(AuthGuard)
  @Get()
  async me(@User() user: UserPrincipal) {
    return user
  }

  @UseGuards(AuthGuard)
  @Post('/refresh')
  async refreshToken(
    @User() user: UserPrincipal,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this._authService.refreshToken(user.usuario)

    res.cookie(constants.AUTH_KEY, `Bearer ${response.token}`, {
      httpOnly: true,
      secure: constants.__prod__,
      sameSite: 'lax',
    })

    return response.user
  }

  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(constants.AUTH_KEY)
    return { ok: true }
  }
}

