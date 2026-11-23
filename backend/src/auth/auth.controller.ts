import { Body, Controller, Post, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { Public, Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /** Perfil do usuário logado: as telas se identificam por aqui (T11). */
  @Get('me')
  getProfile(@Usuario() user: UsuarioLogado) {
    return this.authService.perfil(user);
  }
}
