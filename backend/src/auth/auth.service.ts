import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './login.dto';
import { DbService } from '../common/db.service';
import { normalizarEmail, semSenha } from '../usuarios/usuarios.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly db: DbService,
  ) {}

  async login(loginDto: LoginDto) {
    const [usuario] = await this.db.list('usuarios', { email: normalizarEmail(loginDto.email) });

    // Comparação com hash bcrypt (T3). A mensagem é a mesma para e-mail ou senha errados.
    const senhaConfere =
      usuario && typeof usuario.senha === 'string'
        ? await bcrypt.compare(loginDto.senha, usuario.senha)
        : false;

    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException('E-mail ou senha inválidos. Confira os dados e tente novamente.');
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      tipo: usuario.tipo,
      nome: usuario.nome,
      escolaId: usuario.escolaId ?? null,
      perfilId: usuario.perfilId ?? null,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      tipo: usuario.tipo,
      nome: usuario.nome,
    };
  }

  /** Perfil completo do usuário logado (substitui o uso de localStorage.usuario_email, T11). */
  async perfil(user: { id: string }) {
    const usuario = await this.db.get('usuarios', user.id, 'Usuário não encontrado.');
    const resposta: any = semSenha(usuario);
    if (usuario.escolaId) {
      const escola = await this.db.find('escolas', usuario.escolaId);
      resposta.escola = escola
        ? { id: escola.id, nome: escola.nome, setorEducacional: escola.setorEducacional }
        : null;
    }
    return resposta;
  }
}
