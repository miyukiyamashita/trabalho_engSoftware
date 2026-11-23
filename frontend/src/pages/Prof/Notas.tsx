import { SidebarProfessor } from "./SidebarProfessor";
import "./Notas.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, Carregando, ListaVazia } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import {
  BIMESTRES,
  NOME_BIMESTRE,
  NOTA_MAX_BIMESTRE,
  formatarNota,
  notaFinal,
  valorNota,
  type Bimestre,
} from "../../utils/notas";

type LinhaNotas = Record<Bimestre, string>;
const vazio: LinhaNotas = { bim1: "", bim2: "", bim3: "", bim4: "" };

/** RF11: o professor registra e atualiza notas nas turmas/disciplinas em que leciona. */
export function Notas() {
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [bimestre, setBimestre] = useState<Bimestre | "">("");
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<any[] | null>(null);
  const [salvas, setSalvas] = useState<Record<string, LinhaNotas>>({});
  const [notas, setNotas] = useState<Record<string, LinhaNotas>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/turmas"), api.get("/disciplinas")])
      .then(([t, d]) => {
        setTurmas(t.data);
        setDisciplinas(d.data);
      })
      .catch((e) => feedback.erro(lerErro(e, "Não foi possível carregar suas turmas.").mensagem));
  }, [feedback]);

  // Só as disciplinas do professor que fazem parte da turma escolhida.
  const disciplinasDaTurma = useMemo(() => {
    const turma = turmas.find((t) => String(t.id) === turmaId);
    const ids = (turma?.disciplinas ?? []).map(String);
    return disciplinas.filter((d) => ids.includes(String(d.id)));
  }, [turmas, disciplinas, turmaId]);

  useEffect(() => {
    setDisciplinaId(disciplinasDaTurma.length === 1 ? String(disciplinasDaTurma[0].id) : "");
  }, [disciplinasDaTurma]);

  async function carregarNotas(tId: string, dId: string) {
    setAlunos(null);
    setErros({});
    try {
      const [a, n] = await Promise.all([
        api.get("/alunos", { params: { turmaId: tId } }),
        api.get("/notas", { params: { turmaId: tId, disciplinaId: dId } }),
      ]);
      const estrutura: Record<string, LinhaNotas> = {};
      a.data.forEach((aluno: any) => {
        const nota = n.data.find((x: any) => String(x.alunoId) === String(aluno.id));
        estrutura[aluno.id] = Object.fromEntries(
          BIMESTRES.map((b) => [b, nota?.[b] === null || nota?.[b] === undefined ? "" : formatarNota(nota[b])])
        ) as LinhaNotas;
      });
      setAlunos(a.data);
      setSalvas(estrutura);
      setNotas(estrutura);
    } catch (e) {
      setAlunos([]);
      feedback.erro(lerErro(e, "Não foi possível carregar alunos e notas.").mensagem);
    }
  }

  useEffect(() => {
    if (turmaId && disciplinaId) carregarNotas(turmaId, disciplinaId);
    else setAlunos(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, disciplinaId]);

  // Valida enquanto digita: em vez de ignorar valores fora do intervalo, explica o problema (H5/H9).
  function alterarNota(alunoId: string, b: Bimestre, valor: string) {
    const limpo = valor.replace(/[^\d.,]/g, "");
    setNotas((prev) => ({ ...prev, [alunoId]: { ...(prev[alunoId] ?? vazio), [b]: limpo } }));
    const chave = `${alunoId}.${b}`;
    const n = valorNota(limpo);
    setErros((prev) => {
      const copia = { ...prev };
      if (limpo !== "" && (n === null || n < 0 || n > NOTA_MAX_BIMESTRE)) {
        copia[chave] = `Use um valor de 0 a ${NOTA_MAX_BIMESTRE}.`;
      } else {
        delete copia[chave];
      }
      return copia;
    });
  }

  const alteradas = useMemo(() => {
    const lista: Array<{ aluno: any; b: Bimestre; antes: string; depois: string }> = [];
    (alunos ?? []).forEach((aluno) =>
      BIMESTRES.forEach((b) => {
        const antes = salvas[aluno.id]?.[b] ?? "";
        const depois = notas[aluno.id]?.[b] ?? "";
        if (valorNota(antes) !== valorNota(depois)) lista.push({ aluno, b, antes, depois });
      })
    );
    return lista;
  }, [alunos, salvas, notas]);

  async function salvarNotas(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(erros).length > 0) {
      feedback.erro(`Há notas fora do intervalo de 0 a ${NOTA_MAX_BIMESTRE}. Corrija os campos destacados.`);
      return;
    }
    if (alteradas.length === 0) {
      feedback.info("Nenhuma nota foi alterada.");
      return;
    }
    const sobrescritas = alteradas.filter((a) => a.antes !== "");
    const ok = await confirmar({
      titulo: sobrescritas.length > 0 ? "Substituir notas já lançadas?" : "Salvar as notas?",
      mensagem:
        sobrescritas.length > 0
          ? `${sobrescritas.length} nota(s) já salva(s) serão substituídas. Confira antes de confirmar:`
          : `${alteradas.length} nota(s) serão registradas:`,
      detalhes: alteradas.slice(0, 8).map((a) => [
        `${a.aluno.nomeAluno} · ${NOME_BIMESTRE[a.b]}`,
        `${a.antes || "—"} → ${a.depois || "—"}`,
      ]).concat(alteradas.length > 8 ? [["...", `e mais ${alteradas.length - 8} alteração(ões)`]] : []) as Array<[string, string]>,
      textoConfirmar: "Salvar notas",
    });
    if (!ok) return;

    setSalvando(true);
    try {
      await api.post("/notas/lancar", {
        turmaId,
        disciplinaId,
        lancamentos: (alunos ?? []).map((aluno) => ({
          alunoId: String(aluno.id),
          ...Object.fromEntries(BIMESTRES.map((b) => [b, valorNota(notas[aluno.id]?.[b])])),
        })),
      });
      feedback.sucesso(`Notas salvas com sucesso (${alteradas.length} alteração(ões)).`);
      await carregarNotas(turmaId, disciplinaId);
    } catch (erro) {
      const { mensagem, campos } = lerErro(erro, "Não foi possível salvar as notas.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  const colunas = bimestre ? [bimestre] : [...BIMESTRES];
  const visiveis = (alunos ?? []).filter((a) => !busca.trim() || a.nomeAluno.toLowerCase().includes(busca.trim().toLowerCase()));

  return (
    <>
      <main className="conteudo-principal">
        <div className="cabecalho-abas">
          <h1 className="titulo-pagina">Lançamento de notas</h1>
        </div>
        <p className="texto-ajuda">
          Cada bimestre vale de 0 a {NOTA_MAX_BIMESTRE} pontos. A nota final é a soma dos 4 bimestres (0 a 100);
          enquanto faltar bimestre ela aparece como parcial.
        </p>

        <div className="container-filtros-notas">
          <div className="grupo-filtro">
            <label htmlFor="select-turma">Turma:</label>
            <select id="select-turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="select-filtro-custom">
              <option value="">-- Escolha uma turma --</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nomeTurma} - {t.turno}</option>
              ))}
            </select>
          </div>
          <div className="grupo-filtro">
            <label htmlFor="select-disciplina">Disciplina:</label>
            <select id="select-disciplina" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="select-filtro-custom" disabled={!turmaId}>
              <option value="">-- Escolha uma disciplina --</option>
              {disciplinasDaTurma.map((d) => (
                <option key={d.id} value={d.id}>{d.nomeDisciplina}</option>
              ))}
            </select>
          </div>
          <div className="grupo-filtro">
            <label htmlFor="select-bimestre">Bimestre:</label>
            <select id="select-bimestre" value={bimestre} onChange={(e) => setBimestre(e.target.value as Bimestre | "")} className="select-filtro-custom">
              <option value="">Todos os bimestres</option>
              {BIMESTRES.map((b) => (
                <option key={b} value={b}>{NOME_BIMESTRE[b]}</option>
              ))}
            </select>
          </div>
          <div className="grupo-filtro">
            <label htmlFor="busca-aluno">Buscar aluno:</label>
            <input id="busca-aluno" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className="select-filtro-custom" placeholder="Nome do aluno" />
          </div>
        </div>

        {!turmaId || !disciplinaId ? (
          <ListaVazia texto="Escolha a turma e a disciplina para ver e lançar as notas." />
        ) : alunos === null ? (
          <Carregando texto="Carregando alunos e notas..." />
        ) : alunos.length === 0 ? (
          <ListaVazia texto="Nenhum aluno cadastrado nesta turma." />
        ) : (
          <form onSubmit={salvarNotas} className="container-tabela-layout" noValidate>
            <div className="tabela-wrapper-scroll">
              <table className="tabela-boletim-escolar">
                <thead>
                  <tr>
                    <th scope="col" className="col-aluno">Aluno</th>
                    {colunas.map((b) => (
                      <th scope="col" key={b} className="col-bim">{NOME_BIMESTRE[b]} (0–{NOTA_MAX_BIMESTRE})</th>
                    ))}
                    <th scope="col" className="col-nota-final">Nota final (0–100)</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((aluno) => {
                    const final = notaFinal(notas[aluno.id]);
                    return (
                      <tr key={aluno.id}>
                        <th scope="row" className="celula-dados-aluno">
                          <div className="nome-aluno-tabela">{aluno.nomeAluno}</div>
                          <div className="cpf-aluno-tabela">CPF {aluno.cpfAluno}</div>
                        </th>
                        {colunas.map((b) => {
                          const chave = `${aluno.id}.${b}`;
                          return (
                            <td key={b}>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={notas[aluno.id]?.[b] ?? ""}
                                onChange={(e) => alterarNota(aluno.id, b, e.target.value)}
                                placeholder="-"
                                aria-label={`${NOME_BIMESTRE[b]} de ${aluno.nomeAluno}`}
                                aria-invalid={Boolean(erros[chave]) || undefined}
                                aria-describedby={erros[chave] ? `erro-${chave}` : undefined}
                                className={`input-nota-boletim ${erros[chave] ? "campo-invalido" : ""}`}
                              />
                              <CampoErro id={`erro-${chave}`} mensagem={erros[chave]} />
                            </td>
                          );
                        })}
                        <td className="celula-nota-final-resultado">
                          {formatarNota(final.valor)}
                          {final.parcial && <span className="nota-parcial"> (parcial)</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="secao-botao-salvar acoes-formulario">
              <button type="button" className="botao-secundario" disabled={alteradas.length === 0 || salvando} onClick={() => { setNotas(salvas); setErros({}); }}>
                Cancelar alterações
              </button>
              <button type="submit" className="btn-salvar-boletim" disabled={salvando}>
                {salvando ? "Salvando..." : `Salvar notas${alteradas.length ? ` (${alteradas.length})` : ""}`}
              </button>
            </div>
          </form>
        )}
      </main>
      <SidebarProfessor />
    </>
  );
}
