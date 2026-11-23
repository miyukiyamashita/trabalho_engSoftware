import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import { lerErro } from "../../utils/erros";

export type DisciplinaBoletim = {
  id: string;
  nome: string;
  professor: string | null;
  notas: { bim1: number | null; bim2: number | null; bim3: number | null; bim4: number | null };
  notaFinal: number | null;
  notaParcial: boolean;
  frequencia: { aulas: number; presencas: number; percentual: number | null };
  chamadas: Array<{ data: string; presente: boolean }>;
};

export type Painel = {
  aluno: { id: string; nomeAluno: string; nomeResponsavel: string } | null;
  escola?: { nome: string; setorEducacional: string } | null;
  segmento?: string;
  turma?: { id: string; nomeTurma: string; anoSerie: string; turno: string } | null;
  disciplinas?: DisciplinaBoletim[];
  resumo?: { notaGeral: number | null; frequenciaGeral: number | null };
  responsavel?: { nome: string };
  avisos?: { naoLidos: number; ultimos: any[] };
};

/** Dados do filho do responsável logado, montados no backend (sem baixar a lista de alunos, A3). */
export function usePainelResponsavel() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get<Painel>("/responsavel/painel");
      setPainel(data);
      setErro("");
    } catch (e) {
      setErro(lerErro(e, "Não foi possível carregar os dados do aluno.").mensagem);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { painel, erro, carregando: !painel && !erro, recarregar: carregar };
}

/** Faixa da frequência: 90%+ excelente, 75–89% atenção, abaixo de 75% crítico. */
export function situacaoFrequencia(p: number | null) {
  if (p === null) return { texto: "Sem registros", classe: "sem", rotulo: "Sem registros" };
  if (p < 75) return { texto: "Abaixo do esperado!", classe: "critico", rotulo: "Crítico" };
  if (p < 90) return { texto: "Atenção à frequência!", classe: "atencao", rotulo: "Atenção" };
  return { texto: "Frequência excelente!", classe: "excelente", rotulo: "Excelente" };
}
