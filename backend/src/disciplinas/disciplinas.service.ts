import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import { UsuarioLogado, escolaDoUsuario, garantirMesmaEscola } from '../common/escopo';

const CAMPOS = ['nomeDisciplina', 'codigo', 'cargaHoraria', 'areaConhecimento', 'descricao', 'professorId'] as const;

@Injectable()
export class DisciplinasService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
  ) {}

  findAll(user: UsuarioLogado) {
    if (user.tipo === TipoUsuario.PROF) return this.acesso.disciplinasDoProfessor(String(user.perfilId));
    return this.db.list('disciplinas', { escolaId: escolaDoUsuario(user) });
  }

  async findOne(id: string, user: UsuarioLogado) {
    const disciplina = await this.db.get('disciplinas', id, 'Disciplina não encontrada.');
    if (user.tipo === TipoUsuario.PROF) {
      if (String(disciplina.professorId) !== String(user.perfilId)) {
        throw new ForbiddenException('Esta disciplina não é sua.');
      }
    } else {
      garantirMesmaEscola(user, disciplina);
    }
    return disciplina;
  }

  private async validar(dados: Record<string, any>, escolaId: string, disciplinaId?: string) {
    const professor = await this.db.find('professores', dados.professorId);
    if (!professor || String(professor.escolaId) !== String(escolaId)) {
      throw new ForbiddenException({
        message: 'Professor inválido.',
        campos: { professorId: 'Escolha um professor cadastrado na sua escola.' },
      });
    }
    const repetida = (await this.db.list('disciplinas', { escolaId })).find(
      (d) =>
        String(d.codigo).trim().toUpperCase() === String(dados.codigo).trim().toUpperCase() &&
        String(d.id) !== String(disciplinaId ?? ''),
    );
    if (repetida) {
      throw new ConflictException({
        message: 'Este código de disciplina já está em uso.',
        campos: { codigo: `O código ${dados.codigo} já é usado por ${repetida.nomeDisciplina}. Informe outro código.` },
      });
    }
  }

  async create(dados: any, user: UsuarioLogado) {
    const escolaId = escolaDoUsuario(user);
    const disciplina = {
      nomeDisciplina: dados.nomeDisciplina,
      codigo: dados.codigo,
      cargaHoraria: Number(dados.cargaHoraria),
      areaConhecimento: dados.areaConhecimento,
      descricao: dados.descricao,
      professorId: String(dados.professorId),
      escolaId,
    };
    await this.validar(disciplina, escolaId);
    const criada = await this.db.create('disciplinas', disciplina);

    const escola = await this.db.get('escolas', escolaId);
    await this.db.patch('escolas', escolaId, { disciplinas: [...(escola.disciplinas ?? []), criada.codigo] });
    return criada;
  }

  /** Atualização parcial (RF08), inclusive troca de professor. */
  async update(id: string, dados: any, user: UsuarioLogado) {
    const atual = await this.db.get('disciplinas', id, 'Disciplina não encontrada.');
    garantirMesmaEscola(user, atual);

    const alteracoes: Record<string, any> = {};
    for (const campo of CAMPOS) if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    if (alteracoes.cargaHoraria !== undefined) alteracoes.cargaHoraria = Number(alteracoes.cargaHoraria);
    if (alteracoes.professorId !== undefined) alteracoes.professorId = String(alteracoes.professorId);

    await this.validar({ ...atual, ...alteracoes }, atual.escolaId, id);
    const atualizada = await this.db.patch('disciplinas', id, alteracoes);

    if (alteracoes.codigo && alteracoes.codigo !== atual.codigo) {
      const escola = await this.db.find('escolas', atual.escolaId);
      if (escola) {
        await this.db.patch('escolas', escola.id, {
          disciplinas: (escola.disciplinas ?? []).map((c: string) => (c === atual.codigo ? alteracoes.codigo : c)),
        });
      }
    }
    return atualizada;
  }

  async remove(id: string, user: UsuarioLogado) {
    const disciplina = await this.db.get('disciplinas', id, 'Disciplina não encontrada.');
    garantirMesmaEscola(user, disciplina);

    const turmas = (await this.db.list('turmas', { escolaId: disciplina.escolaId })).filter((t) =>
      (t.disciplinas ?? []).map(String).includes(String(id)),
    );
    if (turmas.length > 0) {
      throw new ConflictException(
        `Esta disciplina é oferecida na(s) turma(s) ${turmas.map((t) => t.nomeTurma).join(', ')}. ` +
          'Retire-a dessas turmas antes de excluí-la.',
      );
    }

    const escola = await this.db.find('escolas', disciplina.escolaId);
    if (escola) {
      await this.db.patch('escolas', escola.id, {
        disciplinas: (escola.disciplinas ?? []).filter((c: string) => c !== disciplina.codigo),
      });
    }
    await this.db.remove('disciplinas', id);
    return { message: 'Disciplina excluída com sucesso.' };
  }
}
