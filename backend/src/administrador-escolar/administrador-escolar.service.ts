import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { UsuariosService, normalizarEmail } from '../usuarios/usuarios.service';
import { TipoUsuario } from '../classes/tipo-usuario';

export interface DadosAdministradorEscolar {
  nome: string;
  email: string;
  cargo: string;
  cpf?: string;
  escolaId: string;
}

@Injectable()
export class AdministradoresEscolaresService {
  constructor(
    private readonly db: DbService,
    private readonly usuarios: UsuariosService,
  ) {}

  /** Cria o administrador escolar e o usuário de login (senha só em hash, T3/T5). */
  async create(dados: DadosAdministradorEscolar) {
    const admin = await this.db.create('administradoresEscolares', {
      nome: dados.nome,
      email: normalizarEmail(dados.email),
      cargo: dados.cargo,
      cpf: dados.cpf ?? null,
      escolaId: String(dados.escolaId),
    });

    const credenciais = await this.usuarios.criarComCredenciais(
      {
        nome: admin.nome,
        email: admin.email,
        tipo: TipoUsuario.ADMIN_ESCOLAR,
        escolaId: admin.escolaId,
        perfilId: admin.id,
      },
      'Administrador Escolar',
    );

    return {
      administrador: admin,
      emailEnviado: credenciais.emailEnviado,
      senhaTemporaria: credenciais.senhaTemporaria,
    };
  }

  listarPorEscola(escolaId: string) {
    return this.db.list('administradoresEscolares', { escolaId: String(escolaId) });
  }

  async atualizar(id: string, dados: { nome?: string; email?: string; cargo?: string }) {
    const atualizado = await this.db.patch('administradoresEscolares', id, {
      ...dados,
      ...(dados.email ? { email: normalizarEmail(dados.email) } : {}),
    });
    await this.usuarios.atualizarPorPerfil(TipoUsuario.ADMIN_ESCOLAR, id, dados);
    return atualizado;
  }

  async removerDaEscola(escolaId: string) {
    const admins = await this.listarPorEscola(escolaId);
    for (const admin of admins) {
      await this.usuarios.removerPorPerfil(TipoUsuario.ADMIN_ESCOLAR, admin.id);
      await this.db.remove('administradoresEscolares', admin.id);
    }
  }
}
