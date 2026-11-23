import { ConflictException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { UsuariosService, normalizarEmail, semSenha } from '../usuarios/usuarios.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import {
  UsuarioLogado,
  escolaDoUsuario,
  garantirMesmaEscola,
  somenteDigitos,
} from '../common/escopo';

const CAMPOS = ['nome', 'email', 'cpf', 'telefone', 'dataNascimento', 'formacao'] as const;

@Injectable()
export class ProfessoresService {
  constructor(
    private readonly db: DbService,
    private readonly usuarios: UsuariosService,
  ) {}

  async findAll(user: UsuarioLogado) {
    const lista = await this.db.list('professores', { escolaId: escolaDoUsuario(user) });
    return lista.map(semSenha);
  }

  async findOne(id: string, user: UsuarioLogado) {
    const professor = await this.db.get('professores', id, 'Professor não encontrado.');
    garantirMesmaEscola(user, professor);
    return semSenha(professor);
  }

  private async garantirCpfLivre(cpf: string, excetoId?: string) {
    const todos = await this.db.list('professores');
    const repetido = todos.find(
      (p) => somenteDigitos(p.cpf) === somenteDigitos(cpf) && String(p.id) !== String(excetoId ?? ''),
    );
    if (repetido) {
      throw new ConflictException({
        message: 'Este CPF já está cadastrado.',
        campos: { cpf: 'Este CPF já está cadastrado para outro professor. Confira os números digitados.' },
      });
    }
  }

  async create(dados: any, user: UsuarioLogado) {
    const escolaId = escolaDoUsuario(user);
    await this.garantirCpfLivre(dados.cpf);
    await this.usuarios.garantirEmailLivre(dados.email, 'email');

    const professor = await this.db.create('professores', {
      nome: dados.nome,
      email: normalizarEmail(dados.email),
      cpf: dados.cpf,
      telefone: dados.telefone,
      dataNascimento: dados.dataNascimento,
      formacao: dados.formacao,
      escolaId,
    });

    // Lista na escola mantida por compatibilidade (contadores do dashboard).
    const escola = await this.db.get('escolas', escolaId);
    await this.db.patch('escolas', escolaId, {
      professores: [...(escola.professores ?? []), professor.cpf],
    });

    const credenciais = await this.usuarios.criarComCredenciais(
      { nome: professor.nome, email: professor.email, tipo: TipoUsuario.PROF, escolaId, perfilId: professor.id },
      'Professor',
    );

    return {
      ...professor,
      emailEnviado: credenciais.emailEnviado,
      senhaTemporaria: credenciais.senhaTemporaria,
    };
  }

  /** Atualização parcial (RF06). Atualiza também o usuário de login quando nome/e-mail mudam. */
  async update(id: string, dados: any, user: UsuarioLogado) {
    const atual = await this.db.get('professores', id, 'Professor não encontrado.');
    garantirMesmaEscola(user, atual);

    const alteracoes: Record<string, any> = {};
    for (const campo of CAMPOS) if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];

    if (alteracoes.cpf && somenteDigitos(alteracoes.cpf) !== somenteDigitos(atual.cpf)) {
      await this.garantirCpfLivre(alteracoes.cpf, id);
    }
    if (alteracoes.email) {
      alteracoes.email = normalizarEmail(alteracoes.email);
      if (alteracoes.email !== atual.email) {
        const [login] = await this.db.list('usuarios', { tipo: TipoUsuario.PROF, perfilId: String(id) });
        await this.usuarios.garantirEmailLivre(alteracoes.email, 'email', login?.id);
      }
    }

    const atualizado = await this.db.patch('professores', id, alteracoes);
    await this.usuarios.atualizarPorPerfil(TipoUsuario.PROF, id, {
      nome: alteracoes.nome,
      email: alteracoes.email,
    });

    if (alteracoes.cpf && alteracoes.cpf !== atual.cpf) {
      const escola = await this.db.find('escolas', atual.escolaId);
      if (escola) {
        await this.db.patch('escolas', escola.id, {
          professores: (escola.professores ?? []).map((c: string) => (c === atual.cpf ? alteracoes.cpf : c)),
        });
      }
    }
    return semSenha(atualizado);
  }

  async remove(id: string, user: UsuarioLogado) {
    const professor = await this.db.get('professores', id, 'Professor não encontrado.');
    garantirMesmaEscola(user, professor);

    const disciplinas = await this.db.list('disciplinas', { professorId: String(id) });
    if (disciplinas.length > 0) {
      throw new ConflictException(
        `Este professor ainda leciona ${disciplinas.map((d) => d.nomeDisciplina).join(', ')}. ` +
          'Troque o professor dessas disciplinas antes de excluí-lo.',
      );
    }

    await this.usuarios.removerPorPerfil(TipoUsuario.PROF, id);
    const escola = await this.db.find('escolas', professor.escolaId);
    if (escola) {
      await this.db.patch('escolas', escola.id, {
        professores: (escola.professores ?? []).filter((c: string) => c !== professor.cpf),
      });
    }
    await this.db.remove('professores', id);
    return { message: 'Professor excluído com sucesso.' };
  }
}
