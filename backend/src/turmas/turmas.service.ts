import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import { UsuarioLogado, escolaDoUsuario, garantirMesmaEscola } from '../common/escopo';

const CAMPOS = ['nomeTurma', 'capacidade', 'anoSerie', 'turno', 'alunos', 'disciplinas'] as const;

@Injectable()
export class TurmasService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
  ) {}

  async findAll(user: UsuarioLogado) {
    if (user.tipo === TipoUsuario.PROF) return this.acesso.turmasDoProfessor(String(user.perfilId));
    return this.db.list('turmas', { escolaId: escolaDoUsuario(user) });
  }

  async findOne(id: string, user: UsuarioLogado) {
    if (user.tipo === TipoUsuario.PROF) return this.acesso.garantirAcessoTurma(user, id);
    const turma = await this.db.get('turmas', id, 'Turma não encontrada.');
    garantirMesmaEscola(user, turma);
    return turma;
  }

  /** Validações de negócio da turma (H5): capacidade, vínculos da mesma escola, aluno em uma só turma. */
  private async validar(dados: Record<string, any>, escolaId: string, turmaId?: string) {
    const alunos: string[] = (dados.alunos ?? []).map(String);
    const disciplinas: string[] = (dados.disciplinas ?? []).map(String);
    const capacidade = Number(dados.capacidade);

    if (alunos.length > capacidade) {
      throw new BadRequestException({
        message: 'A turma tem mais alunos do que a capacidade.',
        campos: {
          alunos: `Foram selecionados ${alunos.length} alunos, mas a capacidade é ${capacidade}. Retire alunos ou aumente a capacidade.`,
        },
      });
    }

    const alunosEscola = (await this.db.list('alunos', { escolaId })).map((a) => String(a.id));
    const disciplinasEscola = (await this.db.list('disciplinas', { escolaId })).map((d) => String(d.id));
    if (alunos.some((a) => !alunosEscola.includes(a)) || disciplinas.some((d) => !disciplinasEscola.includes(d))) {
      throw new ForbiddenException('Só é possível vincular alunos e disciplinas da sua escola.');
    }

    const outrasTurmas = (await this.db.list('turmas', { escolaId })).filter(
      (t) => String(t.id) !== String(turmaId ?? ''),
    );
    for (const turma of outrasTurmas) {
      if (String(turma.nomeTurma).trim().toLowerCase() === String(dados.nomeTurma).trim().toLowerCase()) {
        throw new ConflictException({
          message: 'Já existe uma turma com este nome.',
          campos: { nomeTurma: 'Já existe uma turma com este nome na escola. Use um nome diferente (ex.: 5º Ano B).' },
        });
      }
      const repetidos = (turma.alunos ?? []).map(String).filter((a: string) => alunos.includes(a));
      if (repetidos.length > 0) {
        throw new ConflictException({
          message: 'Aluno já matriculado em outra turma.',
          campos: {
            alunos: `${repetidos.length} aluno(s) selecionado(s) já estão na turma ${turma.nomeTurma}. Retire-os de lá primeiro.`,
          },
        });
      }
    }
  }

  async create(dados: any, user: UsuarioLogado) {
    const escolaId = escolaDoUsuario(user);
    const turma = {
      nomeTurma: dados.nomeTurma,
      capacidade: Number(dados.capacidade),
      anoSerie: dados.anoSerie,
      turno: dados.turno,
      alunos: (dados.alunos ?? []).map(String),
      disciplinas: (dados.disciplinas ?? []).map(String),
      escolaId,
    };
    await this.validar(turma, escolaId);
    const criada = await this.db.create('turmas', turma);

    const escola = await this.db.get('escolas', escolaId);
    await this.db.patch('escolas', escolaId, { turmas: [...(escola.turmas ?? []), criada.nomeTurma] });
    return criada;
  }

  /** Atualização parcial (RF07): dados e inclusão/retirada de alunos e disciplinas. */
  async update(id: string, dados: any, user: UsuarioLogado) {
    const atual = await this.db.get('turmas', id, 'Turma não encontrada.');
    garantirMesmaEscola(user, atual);

    const alteracoes: Record<string, any> = {};
    for (const campo of CAMPOS) if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    if (alteracoes.capacidade !== undefined) alteracoes.capacidade = Number(alteracoes.capacidade);
    if (alteracoes.alunos) alteracoes.alunos = alteracoes.alunos.map(String);
    if (alteracoes.disciplinas) alteracoes.disciplinas = alteracoes.disciplinas.map(String);

    await this.validar({ ...atual, ...alteracoes }, atual.escolaId, id);
    const atualizada = await this.db.patch('turmas', id, alteracoes);

    if (alteracoes.nomeTurma && alteracoes.nomeTurma !== atual.nomeTurma) {
      const escola = await this.db.find('escolas', atual.escolaId);
      if (escola) {
        await this.db.patch('escolas', escola.id, {
          turmas: (escola.turmas ?? []).map((n: string) => (n === atual.nomeTurma ? alteracoes.nomeTurma : n)),
        });
      }
    }
    return atualizada;
  }

  /** A escola vem do próprio registro, não do estado da tela (T13). */
  async remove(id: string, user: UsuarioLogado) {
    const turma = await this.db.get('turmas', id, 'Turma não encontrada.');
    garantirMesmaEscola(user, turma);

    for (const nota of await this.db.list('notas', { turmaId: String(id) })) await this.db.remove('notas', nota.id);
    for (const dia of await this.db.list('frequencia', { turmaId: String(id) })) await this.db.remove('frequencia', dia.id);

    const escola = await this.db.find('escolas', turma.escolaId);
    if (escola) {
      await this.db.patch('escolas', escola.id, {
        turmas: (escola.turmas ?? []).filter((n: string) => n !== turma.nomeTurma),
      });
    }
    await this.db.remove('turmas', id);
    return { message: 'Turma excluída com sucesso.' };
  }

  async removerAluno(id: string, alunoId: string, user: UsuarioLogado) {
    const turma = await this.findOne(id, user);
    return this.update(id, { alunos: (turma.alunos ?? []).filter((a: any) => String(a) !== String(alunoId)) }, user);
  }

  async removerDisciplina(id: string, disciplinaId: string, user: UsuarioLogado) {
    const turma = await this.findOne(id, user);
    return this.update(
      id,
      { disciplinas: (turma.disciplinas ?? []).filter((d: any) => String(d) !== String(disciplinaId)) },
      user,
    );
  }
}
