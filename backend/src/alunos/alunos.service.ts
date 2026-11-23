import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { UsuariosService, normalizarEmail, semSenha } from '../usuarios/usuarios.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import {
  UsuarioLogado,
  escolaDoUsuario,
  garantirMesmaEscola,
  somenteDigitos,
} from '../common/escopo';

const CAMPOS = [
  'nomeAluno',
  'cpfAluno',
  'dataNascimentoAluno',
  'nomeResponsavel',
  'emailResponsavel',
  'telefoneResponsavel',
] as const;

@Injectable()
export class AlunosService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
    private readonly usuarios: UsuariosService,
  ) {}

  /** Admin escolar: alunos da escola. Professor: alunos de uma turma sua. Responsável: os filhos. */
  async findAll(user: UsuarioLogado, turmaId?: string) {
    let lista: any[];
    if (user.tipo === TipoUsuario.RESPONSAVEL) {
      lista = await this.acesso.filhosDoResponsavel(user.email);
    } else if (user.tipo === TipoUsuario.PROF) {
      if (!turmaId) throw new ForbiddenException('Informe a turma para listar os alunos.');
      const turma = await this.acesso.garantirAcessoTurma(user, turmaId);
      const ids = (turma.alunos ?? []).map(String);
      lista = (await this.db.list('alunos', { escolaId: turma.escolaId })).filter((a) =>
        ids.includes(String(a.id)),
      );
    } else {
      lista = await this.db.list('alunos', { escolaId: escolaDoUsuario(user) });
      if (turmaId) {
        const turma = await this.db.get('turmas', turmaId, 'Turma não encontrada.');
        garantirMesmaEscola(user, turma);
        const ids = (turma.alunos ?? []).map(String);
        lista = lista.filter((a) => ids.includes(String(a.id)));
      }
    }
    return lista.map(semSenha);
  }

  async findOne(id: string, user: UsuarioLogado) {
    const aluno = await this.db.get('alunos', id, 'Aluno não encontrado.');
    if (user.tipo === TipoUsuario.RESPONSAVEL) {
      await this.acesso.garantirAlunoDoResponsavel(user, id);
    } else {
      garantirMesmaEscola(user, aluno);
    }
    return semSenha(aluno);
  }

  private async garantirCpfLivre(cpf: string, excetoId?: string) {
    const todos = await this.db.list('alunos');
    const repetido = todos.find(
      (a) => somenteDigitos(a.cpfAluno) === somenteDigitos(cpf) && String(a.id) !== String(excetoId ?? ''),
    );
    if (repetido) {
      throw new ConflictException({
        message: 'Este CPF já está cadastrado.',
        campos: { cpfAluno: 'Este CPF já está cadastrado para outro aluno. Confira os números digitados.' },
      });
    }
  }

  /**
   * O responsável é identificado pelo e-mail. Se já existir um responsável com esse
   * e-mail na mesma escola (irmãos), o login é reaproveitado.
   */
  private async loginDoResponsavel(email: string, escolaId: string) {
    const existente = await this.usuarios.buscarPorEmail(email);
    if (!existente) return null;
    if (existente.tipo === TipoUsuario.RESPONSAVEL && String(existente.escolaId) === String(escolaId)) {
      return existente;
    }
    throw new ConflictException({
      message: 'Este e-mail já está cadastrado no sistema.',
      campos: { emailResponsavel: 'Este e-mail já pertence a outro usuário. Informe outro e-mail para o responsável.' },
    });
  }

  async create(dados: any, user: UsuarioLogado) {
    const escolaId = escolaDoUsuario(user);
    await this.garantirCpfLivre(dados.cpfAluno);
    const loginExistente = await this.loginDoResponsavel(dados.emailResponsavel, escolaId);

    const aluno = await this.db.create('alunos', {
      nomeAluno: dados.nomeAluno,
      cpfAluno: dados.cpfAluno,
      dataNascimentoAluno: dados.dataNascimentoAluno,
      nomeResponsavel: dados.nomeResponsavel,
      emailResponsavel: normalizarEmail(dados.emailResponsavel),
      telefoneResponsavel: dados.telefoneResponsavel,
      escolaId,
    });

    const escola = await this.db.get('escolas', escolaId);
    await this.db.patch('escolas', escolaId, { alunos: [...(escola.alunos ?? []), aluno.cpfAluno] });

    if (loginExistente) {
      return { ...aluno, emailEnviado: false, responsavelJaTinhaAcesso: true };
    }
    const credenciais = await this.usuarios.criarComCredenciais(
      { nome: aluno.nomeResponsavel, email: aluno.emailResponsavel, tipo: TipoUsuario.RESPONSAVEL, escolaId },
      'Responsável',
    );
    return { ...aluno, emailEnviado: credenciais.emailEnviado, senhaTemporaria: credenciais.senhaTemporaria };
  }

  /** Atualização parcial (RF09), incluindo os dados do responsável. */
  async update(id: string, dados: any, user: UsuarioLogado) {
    const atual = await this.db.get('alunos', id, 'Aluno não encontrado.');
    garantirMesmaEscola(user, atual);

    const alteracoes: Record<string, any> = {};
    for (const campo of CAMPOS) if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];

    if (alteracoes.cpfAluno && somenteDigitos(alteracoes.cpfAluno) !== somenteDigitos(atual.cpfAluno)) {
      await this.garantirCpfLivre(alteracoes.cpfAluno, id);
    }

    let resultadoLogin: Record<string, any> = {};
    const emailAntigo = normalizarEmail(atual.emailResponsavel);
    const emailNovo = alteracoes.emailResponsavel ? normalizarEmail(alteracoes.emailResponsavel) : emailAntigo;
    alteracoes.emailResponsavel = emailNovo;
    const nomeResponsavel = alteracoes.nomeResponsavel ?? atual.nomeResponsavel;

    if (emailNovo !== emailAntigo) {
      const loginNovo = await this.loginDoResponsavel(emailNovo, atual.escolaId);
      const irmaos = (await this.acesso.filhosDoResponsavel(emailAntigo)).filter((a) => String(a.id) !== String(id));
      const loginAntigo = await this.usuarios.buscarPorEmail(emailAntigo);
      if (!loginNovo && irmaos.length === 0 && loginAntigo) {
        // Só este aluno usava o login: troca o e-mail mantendo a senha.
        await this.db.patch('usuarios', loginAntigo.id, { email: emailNovo, nome: nomeResponsavel });
      } else {
        if (!loginNovo) {
          const cred = await this.usuarios.criarComCredenciais(
            { nome: nomeResponsavel, email: emailNovo, tipo: TipoUsuario.RESPONSAVEL, escolaId: atual.escolaId },
            'Responsável',
          );
          resultadoLogin = { emailEnviado: cred.emailEnviado, senhaTemporaria: cred.senhaTemporaria };
        }
        if (irmaos.length === 0 && loginAntigo) await this.usuarios.remover(loginAntigo.id);
      }
    } else if (alteracoes.nomeResponsavel) {
      const login = await this.usuarios.buscarPorEmail(emailAntigo);
      if (login) await this.db.patch('usuarios', login.id, { nome: alteracoes.nomeResponsavel });
    }

    const atualizado = await this.db.patch('alunos', id, alteracoes);

    if (alteracoes.cpfAluno && alteracoes.cpfAluno !== atual.cpfAluno) {
      const escola = await this.db.find('escolas', atual.escolaId);
      if (escola) {
        await this.db.patch('escolas', escola.id, {
          alunos: (escola.alunos ?? []).map((c: string) => (c === atual.cpfAluno ? alteracoes.cpfAluno : c)),
        });
      }
    }
    return { ...semSenha(atualizado), ...resultadoLogin };
  }

  async remove(id: string, user: UsuarioLogado) {
    const aluno = await this.db.get('alunos', id, 'Aluno não encontrado.');
    garantirMesmaEscola(user, aluno);

    const turmas = await this.db.list('turmas', { escolaId: aluno.escolaId });
    const turma = turmas.find((t) => (t.alunos ?? []).map(String).includes(String(id)));
    if (turma) {
      throw new ConflictException(
        `Este aluno está matriculado na turma ${turma.nomeTurma}. Retire-o da turma antes de excluí-lo.`,
      );
    }

    const irmaos = (await this.acesso.filhosDoResponsavel(aluno.emailResponsavel)).filter(
      (a) => String(a.id) !== String(id),
    );
    if (irmaos.length === 0) {
      const login = await this.usuarios.buscarPorEmail(aluno.emailResponsavel);
      if (login && login.tipo === TipoUsuario.RESPONSAVEL) await this.usuarios.remover(login.id);
    }

    const escola = await this.db.find('escolas', aluno.escolaId);
    if (escola) {
      await this.db.patch('escolas', escola.id, {
        alunos: (escola.alunos ?? []).filter((c: string) => c !== aluno.cpfAluno),
      });
    }
    await this.db.remove('alunos', id);
    return { message: 'Aluno excluído com sucesso.' };
  }
}
