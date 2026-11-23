/**
 * REGRA DA NOTA FINAL (requisito de sistema derivado do RF11 — T16/H4):
 *  - cada bimestre vale de 0 a 25 pontos;
 *  - a nota final da disciplina é a SOMA dos 4 bimestres (0 a 100 pontos);
 *  - enquanto faltar algum bimestre, a soma é exibida como "parcial";
 *  - a nota geral do aluno é a média das notas finais das disciplinas que têm nota.
 * Esta regra é aplicada igualmente na tela do professor, no boletim, no painel do
 * responsável e no relatório final em PDF (o frontend tem a mesma regra em utils/notas.ts).
 */
export const NOTA_MAX_BIMESTRE = 25;
export const NOTA_MAX_FINAL = 100;
export const BIMESTRES = ['bim1', 'bim2', 'bim3', 'bim4'] as const;

export function valorNota(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function notaFinal(nota: Record<string, any> | null | undefined) {
  const valores = BIMESTRES.map((b) => valorNota(nota?.[b])).filter((v): v is number => v !== null);
  if (valores.length === 0) return { valor: null as number | null, parcial: false, lancados: 0 };
  const soma = valores.reduce((acc, v) => acc + v, 0);
  return { valor: Math.round(soma * 10) / 10, parcial: valores.length < BIMESTRES.length, lancados: valores.length };
}

export function mediaGeral(finais: Array<number | null>) {
  const validas = finais.filter((v): v is number => v !== null);
  if (validas.length === 0) return null;
  return Math.round((validas.reduce((a, b) => a + b, 0) / validas.length) * 10) / 10;
}

/** Frequência: presenças ÷ aulas registradas. Sem aulas registradas → null ("Sem registros", T17). */
export function percentualFrequencia(presencas: number, aulas: number) {
  return aulas > 0 ? Math.round((presencas / aulas) * 100) : null;
}

const SEGMENTOS: Record<string, string> = {
  infantil: 'Educação Infantil',
  fundamental: 'Ensino Fundamental I',
};

/** Segmento de ensino real da escola (H2), em vez de texto fixo. */
export function segmentoDaEscola(setor?: string | null) {
  return SEGMENTOS[String(setor ?? '').toLowerCase()] ?? setor ?? 'Não informado';
}
