/**
 * REGRA DA NOTA FINAL (mesma regra do backend, backend/src/common/notas.ts — T16/H4):
 *  - cada bimestre vale de 0 a 25 pontos;
 *  - a nota final da disciplina é a SOMA dos 4 bimestres (0 a 100);
 *  - enquanto faltar bimestre, a soma é "parcial";
 *  - a nota geral do aluno é a média das notas finais das disciplinas com nota.
 */
export const NOTA_MAX_BIMESTRE = 25;
export const NOTA_MAX_FINAL = 100;
export const BIMESTRES = ["bim1", "bim2", "bim3", "bim4"] as const;
export type Bimestre = (typeof BIMESTRES)[number];
export const NOME_BIMESTRE: Record<Bimestre, string> = {
  bim1: "1º bimestre",
  bim2: "2º bimestre",
  bim3: "3º bimestre",
  bim4: "4º bimestre",
};

export function valorNota(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function notaFinal(notas: Partial<Record<Bimestre, unknown>> | undefined) {
  const valores = BIMESTRES.map((b) => valorNota(notas?.[b])).filter((v): v is number => v !== null);
  if (valores.length === 0) return { valor: null as number | null, parcial: false };
  const soma = valores.reduce((a, b) => a + b, 0);
  return { valor: Math.round(soma * 10) / 10, parcial: valores.length < BIMESTRES.length };
}

export function formatarNota(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return String(v).replace(".", ",");
}

/** Faixa de desempenho da nota final (0–100) usada nas cores. */
export function situacaoNota(v: number | null | undefined): "bom" | "medio" | "ruim" | "sem" {
  if (v === null || v === undefined) return "sem";
  if (v >= 70) return "bom";
  if (v >= 60) return "medio";
  return "ruim";
}
