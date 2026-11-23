import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import { UsuarioLogado } from '../common/escopo';
import { BIMESTRES, NOTA_MAX_BIMESTRE, valorNota } from '../common/notas';

export interface LancamentoNota {
  alunoId: string;
  bim1?: number | null;
  bim2?: number | null;
  bim3?: number | null;
  bim4?: number | null;
}

@Injectable()
export class NotasService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
  ) {}

  async findByTurma(turmaId: string, user: UsuarioLogado, disciplinaId?: string) {
    await this.acesso.garantirAcessoTurma(user, turmaId, disciplinaId);
    let notas = await this.db.list('notas', { turmaId: String(turmaId) });
    if (disciplinaId) notas = notas.filter((n) => String(n.disciplinaId) === String(disciplinaId));
    if (user.tipo === TipoUsuario.PROF) {
      const minhas = (await this.acesso.disciplinasDoProfessor(String(user.perfilId))).map((d) => String(d.id));
      notas = notas.filter((n) => minhas.includes(String(n.disciplinaId)));
    }
    return notas;
  }

  /** RF11: registra ou atualiza as notas de uma turma/disciplina do professor. */
  async lancar(payload: { turmaId: string; disciplinaId: string; lancamentos: LancamentoNota[] }, user: UsuarioLogado) {
    const turma = await this.acesso.garantirAcessoTurma(user, payload.turmaId, payload.disciplinaId);
    const alunosTurma = (turma.alunos ?? []).map(String);

    const erros: Record<string, string> = {};
    for (const l of payload.lancamentos) {
      if (!alunosTurma.includes(String(l.alunoId))) {
        throw new BadRequestException('Há alunos que não pertencem a esta turma.');
      }
      for (const b of BIMESTRES) {
        const v = valorNota(l[b]);
        if (l[b] !== null && l[b] !== undefined && (v === null || v < 0 || v > NOTA_MAX_BIMESTRE)) {
          erros[`${l.alunoId}.${b}`] = `A nota deve estar entre 0 e ${NOTA_MAX_BIMESTRE}.`;
        }
      }
    }
    if (Object.keys(erros).length > 0) {
      throw new BadRequestException({
        message: `Há notas fora do intervalo permitido (0 a ${NOTA_MAX_BIMESTRE}). Corrija os campos destacados.`,
        campos: erros,
      });
    }

    const existentes = await this.db.list('notas', {
      turmaId: String(payload.turmaId),
      disciplinaId: String(payload.disciplinaId),
    });
    const resultados: any[] = [];
    for (const l of payload.lancamentos) {
      const dados = {
        turmaId: String(payload.turmaId),
        disciplinaId: String(payload.disciplinaId),
        alunoId: String(l.alunoId),
        escolaId: String(turma.escolaId),
        bim1: valorNota(l.bim1),
        bim2: valorNota(l.bim2),
        bim3: valorNota(l.bim3),
        bim4: valorNota(l.bim4),
        atualizadoEm: new Date().toISOString(),
      };
      const atual = existentes.find((n) => String(n.alunoId) === String(l.alunoId));
      resultados.push(atual ? await this.db.patch('notas', atual.id, dados) : await this.db.create('notas', dados));
    }
    return { message: 'Notas salvas com sucesso.', totalProcessado: resultados.length, dados: resultados };
  }
}
