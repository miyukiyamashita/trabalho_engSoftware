import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./pageEscolar.css";
import "./turma.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useNavigate, useLocation } from "react-router-dom";
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, Carregando, ListaVazia, propsErro } from "../../components/Campos";
import { CampoTexto, useFormulario } from "../../components/Formulario";
import { lerErro } from "../../utils/erros";
import { obrigatorios } from "../../utils/validadores";

const formInicial = {
  nomeTurma: "",
  capacidade: "",
  anoSerie: "",
  turno: "",
  disciplinas: [] as string[],
  alunos: [] as string[],
};
const ROTULOS = { nomeTurma: "Nome da turma", capacidade: "Capacidade", anoSerie: "Ano/Série", turno: "Turno" };

type Opcao = { value: string; label: string };

/** RF07: o administrador escolar cadastra, edita (dados e vínculos) e exclui turmas. */
export function Turmas() {
  const navigate = useNavigate();
  const location = useLocation();
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [aba, setAba] = useState<"cadastro" | "visualizacao">(location.state?.aba === "visualizacao" ? "visualizacao" : "cadastro");
  const [turmas, setTurmas] = useState<any[] | null>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const { form, setForm, erros, setErros, alterar, definir } = useFormulario(formInicial);

  const carregar = useCallback(async () => {
    try {
      const [t, a, d, p] = await Promise.all([
        api.get("/turmas"),
        api.get("/alunos"),
        api.get("/disciplinas"),
        api.get("/professores"),
      ]);
      setTurmas(t.data);
      setAlunos(a.data);
      setDisciplinas(d.data);
      setProfessores(p.data);
      return t.data as any[];
    } catch (e) {
      setTurmas([]);
      feedback.erro(lerErro(e, "Não foi possível carregar as turmas.").mensagem);
      return [];
    }
  }, [feedback]);

  useEffect(() => {
    carregar().then((lista) => {
      const id = location.state?.editarId;
      const alvo = id && lista.find((t) => String(t.id) === String(id));
      if (alvo) editar(alvo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregar]);

  // Aluno só pode estar em uma turma: fora da turma em edição, os já matriculados ficam indisponíveis.
  const matriculados = useMemo(() => {
    const mapa = new Map<string, string>();
    (turmas ?? []).forEach((t) => {
      if (editando && String(t.id) === String(editando.id)) return;
      (t.alunos ?? []).forEach((a: string) => mapa.set(String(a), t.nomeTurma));
    });
    return mapa;
  }, [turmas, editando]);

  const opcoesAlunos: Opcao[] = alunos
    .filter((a) => !matriculados.has(String(a.id)))
    .map((a) => ({ value: String(a.id), label: `${a.nomeAluno} (${a.cpfAluno})` }));
  const opcoesDisciplinas: Opcao[] = disciplinas.map((d) => ({
    value: String(d.id),
    label: `${d.nomeDisciplina} - ${professores.find((p) => String(p.id) === String(d.professorId))?.nome ?? "sem professor"}`,
  }));

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (turmas ?? []).filter((x) => !t || `${x.nomeTurma} ${x.turno}`.toLowerCase().includes(t));
  }, [turmas, busca]);

  function limpar() {
    setForm(formInicial);
    setErros({});
    setEditando(null);
  }

  function cancelar() {
    const voltar = Boolean(editando);
    limpar();
    if (voltar) setAba("visualizacao");
  }

  function editar(t: any) {
    setEditando(t);
    setForm({
      nomeTurma: t.nomeTurma ?? "",
      capacidade: String(t.capacidade ?? ""),
      anoSerie: String(t.anoSerie ?? ""),
      turno: t.turno ?? "",
      alunos: (t.alunos ?? []).map(String),
      disciplinas: (t.disciplinas ?? []).map(String),
    });
    setErros({});
    setAba("cadastro");
  }

  function validar() {
    const e = obrigatorios(form, ROTULOS);
    const cap = Number(form.capacidade);
    if (form.capacidade && (!Number.isInteger(cap) || cap < 1 || cap > 60)) {
      e.capacidade = "Capacidade: informe um número inteiro de 1 a 60 (ex.: 30).";
    } else if (form.alunos.length > cap) {
      e.alunos = `Foram selecionados ${form.alunos.length} alunos, mas a capacidade é ${cap}. Retire alunos ou aumente a capacidade.`;
    }
    return e;
  }

  const nomes = (ids: string[], lista: Opcao[]) =>
    ids.map((id) => lista.find((o) => o.value === id)?.label.split(" (")[0].split(" - ")[0] ?? id).join(", ") || "nenhum";

  async function enviarTurma(ev: React.FormEvent) {
    ev.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    const todosAlunos = alunos.map((a) => ({ value: String(a.id), label: a.nomeAluno }));
    if (editando) {
      const detalhes: Array<[string, string]> = [];
      (["nomeTurma", "capacidade", "anoSerie", "turno"] as const).forEach((c) => {
        if (String(editando[c] ?? "") !== String(form[c])) detalhes.push([ROTULOS[c], `${editando[c] || "—"} → ${form[c]}`]);
      });
      const antesA = (editando.alunos ?? []).map(String);
      const entram = form.alunos.filter((a) => !antesA.includes(a));
      const saem = antesA.filter((a: string) => !form.alunos.includes(a));
      if (entram.length) detalhes.push(["Alunos incluídos", nomes(entram, todosAlunos)]);
      if (saem.length) detalhes.push(["Alunos retirados", nomes(saem, todosAlunos)]);
      const antesD = (editando.disciplinas ?? []).map(String);
      const dEntram = form.disciplinas.filter((d) => !antesD.includes(d));
      const dSaem = antesD.filter((d: string) => !form.disciplinas.includes(d));
      if (dEntram.length) detalhes.push(["Disciplinas incluídas", nomes(dEntram, opcoesDisciplinas)]);
      if (dSaem.length) detalhes.push(["Disciplinas retiradas", nomes(dSaem, opcoesDisciplinas)]);
      if (detalhes.length === 0) {
        feedback.info("Nenhuma informação foi alterada.");
        return;
      }
      const ok = await confirmar({
        titulo: "Salvar alterações da turma?",
        mensagem: `Confira as alterações em ${editando.nomeTurma}:`,
        detalhes,
        textoConfirmar: "Salvar alterações",
      });
      if (!ok) return;
    }

    setSalvando(true);
    try {
      const payload = { ...form, capacidade: Number(form.capacidade) };
      if (editando) {
        await api.patch(`/turmas/${editando.id}`, payload);
        feedback.sucesso(`Turma ${form.nomeTurma} atualizada com sucesso.`);
        setAba("visualizacao");
      } else {
        await api.post("/turmas", payload);
        feedback.sucesso(`Turma ${form.nomeTurma} cadastrada com sucesso.`);
      }
      limpar();
      carregar();
    } catch (e) {
      const { mensagem, campos } = lerErro(e, "Não foi possível salvar a turma.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirTurma(t: any) {
    const ok = await confirmar({
      titulo: `Excluir a turma ${t.nomeTurma}?`,
      mensagem: "As notas e chamadas lançadas nesta turma também serão apagadas. Os alunos continuam cadastrados. Esta ação não pode ser desfeita.",
      detalhes: [["Alunos", String((t.alunos ?? []).length)], ["Disciplinas", String((t.disciplinas ?? []).length)]],
      textoConfirmar: "Excluir turma",
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/turmas/${t.id}`);
      feedback.sucesso(`Turma ${t.nomeTurma} excluída com sucesso.`);
      carregar();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível excluir a turma.").mensagem);
    }
  }

  const selecionados = (ids: string[], opcoes: Opcao[], todos: Opcao[]) =>
    ids.map((id) => opcoes.find((o) => o.value === id) ?? todos.find((o) => o.value === id) ?? { value: id, label: id });

  return (
    <>
      <main className="conteudo-principal-turmas">
        <div className="cabecalho-abas">
          <div className="botoes-alternador" role="tablist" aria-label="Modo da tela">
            <button type="button" role="tab" aria-selected={aba === "cadastro"} className={aba === "cadastro" ? "botao-aba ativo" : "botao-aba"} onClick={() => setAba("cadastro")}>
              {editando ? "Editar" : "Cadastrar"}
            </button>
            <button type="button" role="tab" aria-selected={aba === "visualizacao"} className={aba === "visualizacao" ? "botao-aba ativo" : "botao-aba"} onClick={() => { limpar(); setAba("visualizacao"); }}>
              Visualizar
            </button>
          </div>
          <h1 className="titulo-pagina">
            {aba === "cadastro" ? (editando ? "Editar turma" : "Cadastro de turmas") : "Turmas da escola"}
          </h1>
        </div>

        {aba === "cadastro" ? (
          <div className="container-cadastro-turmas">
            <form className="formulario-cadastro-turmas" onSubmit={enviarTurma} noValidate>
              <div className="linha-formulario">
                <CampoTexto id="turma-nome" nome="nomeTurma" rotulo="Nome da turma:" valor={form.nomeTurma} erros={erros} onChange={alterar} placeholder="Ex.: 5º Ano A" />
                <CampoTexto id="turma-capacidade" nome="capacidade" rotulo="Capacidade (nº de alunos):" valor={form.capacidade} erros={erros} onChange={alterar} tipo="number" placeholder="Ex.: 30" />
              </div>

              <div className="linha-formulario">
                <div className="campo">
                  <label htmlFor="turma-serie">Ano/Série:</label>
                  <select id="turma-serie" name="anoSerie" value={form.anoSerie} onChange={alterar} {...propsErro("anoSerie", erros)}>
                    <option value="">Selecione...</option>
                    {["1", "2", "3", "4", "5"].map((s) => (
                      <option key={s} value={s}>{s}º ano</option>
                    ))}
                  </select>
                  <CampoErro id="erro-anoSerie" mensagem={erros.anoSerie} />
                </div>
                <div className="campo">
                  <label htmlFor="turma-disciplinas">Disciplinas:</label>
                  <Select
                    inputId="turma-disciplinas"
                    isMulti
                    classNamePrefix="selecionar-turmas"
                    placeholder="Selecione as disciplinas"
                    noOptionsMessage={() => "Nenhuma disciplina cadastrada"}
                    options={opcoesDisciplinas}
                    value={selecionados(form.disciplinas, opcoesDisciplinas, opcoesDisciplinas)}
                    onChange={(sel) => definir("disciplinas", sel.map((s) => s.value))}
                  />
                  <CampoErro id="erro-disciplinas" mensagem={erros.disciplinas} />
                </div>
              </div>

              <div className="linha-formulario">
                <div className="campo">
                  <label htmlFor="turma-turno">Turno:</label>
                  <select id="turma-turno" name="turno" value={form.turno} onChange={alterar} {...propsErro("turno", erros)}>
                    <option value="">Selecione...</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                  <CampoErro id="erro-turno" mensagem={erros.turno} />
                </div>
                <div className="campo">
                  <label htmlFor="turma-alunos">
                    Alunos ({form.alunos.length}{form.capacidade ? ` de ${form.capacidade}` : ""}):
                  </label>
                  <Select
                    inputId="turma-alunos"
                    isMulti
                    options={opcoesAlunos}
                    classNamePrefix="selecionar-turmas"
                    placeholder="Selecione os alunos"
                    noOptionsMessage={() => "Nenhum aluno disponível"}
                    value={selecionados(form.alunos, opcoesAlunos, alunos.map((a) => ({ value: String(a.id), label: a.nomeAluno })))}
                    onChange={(sel) => definir("alunos", sel.map((s) => s.value))}
                  />
                  {!erros.alunos && matriculados.size > 0 && (
                    <span className="dica-campo">Alunos já matriculados em outra turma não aparecem na lista.</span>
                  )}
                  <CampoErro id="erro-alunos" mensagem={erros.alunos} />
                </div>
              </div>

              <div className="acoes-formulario">
                <button type="button" className="botao-secundario" onClick={cancelar}>
                  Cancelar
                </button>
                <button type="submit" className="botao-primario" disabled={salvando}>
                  {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="container-tabela-turmas">
            <div style={{ width: "100%" }}>
              <div className="barra-filtros">
                <label>
                  Buscar turma
                  <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou turno" />
                </label>
              </div>
              {turmas === null ? (
                <Carregando texto="Carregando turmas..." />
              ) : filtradas.length === 0 ? (
                <ListaVazia texto={busca ? "Nenhuma turma encontrada para a busca." : "Nenhuma turma cadastrada ainda. Use a aba Cadastrar."} />
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela-turmas">
                    <thead>
                      <tr>
                        <th scope="col">Turma</th>
                        <th scope="col">Ano/Série</th>
                        <th scope="col">Turno</th>
                        <th scope="col">Alunos</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((t) => (
                        <tr key={t.id}>
                          <td>{t.nomeTurma}</td>
                          <td>{t.anoSerie}º ano</td>
                          <td>{t.turno}</td>
                          <td>{(t.alunos ?? []).length} de {t.capacidade}</td>
                          <td>
                            <div className="acoes-tabela">
                              <button type="button" className="botao-secundario" onClick={() => navigate(`/admin-escolar/turmas/${t.id}`)}>
                                <FiEye aria-hidden="true" /> Ver detalhes
                              </button>
                              <button type="button" className="botao-editar" onClick={() => editar(t)} aria-label={`Editar ${t.nomeTurma}`}>
                                <FiEdit2 aria-hidden="true" /> Editar
                              </button>
                              <button type="button" className="botao-perigo" onClick={() => excluirTurma(t)} aria-label={`Excluir ${t.nomeTurma}`}>
                                <FiTrash2 aria-hidden="true" /> Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SidebarAdminEscolar />
    </>
  );
}
