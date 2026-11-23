import { ConflictException, Global, Injectable, Module } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DbService } from '../common/db.service';
import { EmailService } from '../email/email.service';
import { EmailModule } from '../email/email.module';
import gerarSenhaAleatoria from '../utils/password.util';
import { TipoUsuario } from '../classes/tipo-usuario';

export const BCRYPT_ROUNDS = 10;

export interface NovoUsuario {
  nome: string;
  email: string;
  tipo: TipoUsuario;
  escolaId?: string | null;
  perfilId?: string | null;
}

/** Resultado devolvido para quem cadastrou (T8): a senha só aparece se o e-mail não saiu. */
export interface ResultadoCredenciais {
  emailEnviado: boolean;
  senhaTemporaria?: string;
}

/** Remove o campo senha de qualquer registro antes de devolvê-lo pela API (T5). */
export function semSenha<T extends Record<string, any>>(registro: T): Omit<T, 'senha'> {
  if (!registro) return registro;
  const { senha: _senha, ...resto } = registro;
  return resto;
}

export function normalizarEmail(email: string) {
  return String(email ?? '').trim().toLowerCase();
}

@Injectable()
export class UsuariosService {
  constructor(
    private readonly db: DbService,
    private readonly email: EmailService,
  ) {}

  async buscarPorEmail(email: string) {
    const lista = await this.db.list('usuarios', { email: normalizarEmail(email) });
    return lista[0] ?? null;
  }

  /** Lança 409 com mensagem por campo se o e-mail já pertence a outro usuário. */
  async garantirEmailLivre(email: string, campo = 'email', excetoUsuarioId?: string) {
    const existente = await this.buscarPorEmail(email);
    if (existente && String(existente.id) !== String(excetoUsuarioId ?? '')) {
      throw new ConflictException({
        message: 'Este e-mail já está cadastrado no sistema.',
        campos: { [campo]: 'Este e-mail já está cadastrado. Informe outro e-mail.' },
      });
    }
  }

  /**
   * Cria o usuário de login ANTES de tentar o e-mail (T8). Se o envio falhar
   * ou o SMTP não estiver configurado, a senha volta para quem cadastrou.
   */
  async criarComCredenciais(dados: NovoUsuario, contexto: string): Promise<ResultadoCredenciais & { usuario: any }> {
    const senha = gerarSenhaAleatoria(10);
    const usuario = await this.db.create('usuarios', {
      nome: dados.nome,
      email: normalizarEmail(dados.email),
      senha: await bcrypt.hash(senha, BCRYPT_ROUNDS),
      tipo: dados.tipo,
      escolaId: dados.escolaId ?? null,
      perfilId: dados.perfilId ?? null,
    });
    const emailEnviado = await this.email.enviarCredenciais(dados.nome, usuario.email, senha, contexto);
    return {
      usuario: semSenha(usuario),
      emailEnviado,
      ...(emailEnviado ? {} : { senhaTemporaria: senha }),
    };
  }

  async atualizarPorPerfil(tipo: TipoUsuario, perfilId: string, dados: { nome?: string; email?: string }) {
    const lista = await this.db.list('usuarios', { tipo, perfilId: String(perfilId) });
    for (const u of lista) {
      await this.db.patch('usuarios', u.id, {
        ...(dados.nome ? { nome: dados.nome } : {}),
        ...(dados.email ? { email: normalizarEmail(dados.email) } : {}),
      });
    }
  }

  async removerPorPerfil(tipo: TipoUsuario, perfilId: string) {
    const lista = await this.db.list('usuarios', { tipo, perfilId: String(perfilId) });
    for (const u of lista) await this.db.remove('usuarios', u.id);
  }

  async remover(id: string) {
    await this.db.remove('usuarios', id);
  }

  async contar() {
    return (await this.db.list('usuarios')).length;
  }
}

@Global()
@Module({
  imports: [EmailModule],
  providers: [UsuariosService],
  exports: [UsuariosService, EmailModule],
})
export class UsuariosModule {}
