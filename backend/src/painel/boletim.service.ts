import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { mediaGeral, notaFinal, percentualFrequencia, segmentoDaEscola } from '../common/notas';

/**
 * Monta o boletim de um aluno (notas + frequência por disciplina) usando a regra
 * única de nota final (common/notas.ts). Usado pelo painel do responsável e pelo PDF.
 */
@Injectable()
export class BoletimService {
  constructor(private readonly db: DbService) {}

  async montar(aluno: any) {
    const escola = await this.db.find('escolas', aluno.escolaId);
    const turmas = await this.db.list('turmas', { escolaId: String(aluno.escolaId) });
    const turma = turmas.find((t) => (t.alunos ?? []).map(String).includes(String(aluno.id))) ?? null;

    const base = {
      aluno: {
        id: aluno.id,
        nomeAluno: aluno.nomeAluno,
        nomeResponsavel: aluno.nomeResponsavel,
      },
      escola: escola ? { nome: escola.nome, setorEducacional: escola.setorEducacional } : null,
      segmento: segmentoDaEscola(escola?.setorEducacional),
      turma: turma
        ? { id: turma.id, nomeTurma: turma.nomeTurma, anoSerie: turma.anoSerie, turno: turma.turno }
        : null,
    };
    if (!turma) {
      return { ...base, disciplinas: [], resumo: { notaGeral: null, frequenciaGeral: null } };
    }

    const [disciplinasEscola, professores, notas, chamadas] = await Promise.all([
      this.db.list('disciplinas', { escolaId: String(aluno.escolaId) }),
      this.db.list('professores', { escolaId: String(aluno.escolaId) }),
      this.db.list('notas', { turmaId: String(turma.id) }),
      this.db.list('frequencia', { turmaId: String(turma.id) }),
    ]);

    let aulasTotal = 0;
    let presencasTotal = 0;
    const disciplinas = (turma.disciplinas ?? [])
      .map((id: any) => disciplinasEscola.find((d) => String(d.id) === String(id)))
      .filter(Boolean)
      .map((d: any) => {
        const nota = notas.find((n) => String(n.alunoId) === String(aluno.id) && String(n.disciplinaId) === String(d.id));
        const final = notaFinal(nota);
        const registros = chamadas
          .filter((c) => String(c.disciplinaId) === String(d.id))
          .map((c) => ({
            data: c.data,
            presente: (c.chamada ?? []).find((r: any) => String(r.alunoId) === String(aluno.id))?.presente,
          }))
          .filter((r) => r.presente !== undefined)
          .sort((a, b) => String(a.data).localeCompare(String(b.data)));
        const presencas = registros.filter((r) => r.presente === true).length;
        aulasTotal += registros.length;
        presencasTotal += presencas;
        return {
          id: d.id,
          nome: d.nomeDisciplina,
          professor: professores.find((p) => String(p.id) === String(d.professorId))?.nome ?? null,
          notas: {
            bim1: nota?.bim1 ?? null,
            bim2: nota?.bim2 ?? null,
            bim3: nota?.bim3 ?? null,
            bim4: nota?.bim4 ?? null,
          },
          notaFinal: final.valor,
          notaParcial: final.parcial,
          frequencia: {
            aulas: registros.length,
            presencas,
            percentual: percentualFrequencia(presencas, registros.length),
          },
          chamadas: registros,
        };
      });

    return {
      ...base,
      disciplinas,
      resumo: {
        notaGeral: mediaGeral(disciplinas.map((d: any) => d.notaFinal)),
        frequenciaGeral: percentualFrequencia(presencasTotal, aulasTotal),
      },
    };
  }
}
