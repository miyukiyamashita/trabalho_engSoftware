import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { UsuarioLogado } from '../common/escopo';

@Injectable()
export class FrequenciaService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
  ) {}

  async buscar(turmaId: string, disciplinaId: string, data: string, user: UsuarioLogado) {
    await this.acesso.garantirAcessoTurma(user, turmaId, disciplinaId);
    const [registro] = await this.db.list('frequencia', {
      turmaId: String(turmaId),
      disciplinaId: String(disciplinaId),
      data,
    });
    return registro ?? null;
  }

  /** RF12: registra (ou substitui) a chamada da turma/disciplina na data. */
  async registrar(
    payload: { turmaId: string; disciplinaId: string; data: string; chamada: { alunoId: string; presente: boolean }[] },
    user: UsuarioLogado,
  ) {
    const turma = await this.acesso.garantirAcessoTurma(user, payload.turmaId, payload.disciplinaId);
    const alunosTurma = (turma.alunos ?? []).map(String);
    if (payload.chamada.some((c) => !alunosTurma.includes(String(c.alunoId)))) {
      throw new BadRequestException('Há alunos que não pertencem a esta turma.');
    }
    if (payload.data > new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException({
        message: 'Não é possível registrar frequência em data futura.',
        campos: { data: 'Escolha a data de hoje ou uma data anterior.' },
      });
    }

    const dados = {
      turmaId: String(payload.turmaId),
      disciplinaId: String(payload.disciplinaId),
      data: payload.data,
      escolaId: String(turma.escolaId),
      chamada: payload.chamada.map((c) => ({ alunoId: String(c.alunoId), presente: Boolean(c.presente) })),
      atualizadoEm: new Date().toISOString(),
    };
    const [existente] = await this.db.list('frequencia', {
      turmaId: dados.turmaId,
      disciplinaId: dados.disciplinaId,
      data: dados.data,
    });
    return existente ? this.db.patch('frequencia', existente.id, dados) : this.db.create('frequencia', dados);
  }
}
