import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./pageEscolar.css";
import "./disciplinas.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, Carregando, ListaVazia, propsErro } from "../../components/Campos";
import { CampoTexto, diferencas, somenteAlterados, useFormulario } from "../../components/Formulario";
import { lerErro } from "../../utils/erros";
import { obrigatorios, validarCargaHoraria } from "../../utils/validadores";

const formInicial = {
  nomeDisciplina: "",
  cargaHoraria: "",
  codigo: "",
  areaConhecimento: "",
  descricao: "",
  professorId: "",
};
const ROTULOS = {
  nomeDisciplina: "Nome da disciplina",
  cargaHoraria: "Carga horária semanal",
  codigo: "Código da disciplina",
  areaConhecimento: "Área do conhecimento",
  descricao: "Descrição",
  professorId: "Professor",
};
const AREAS = ["Exatas", "Natureza", "Humanas", "Linguagens", "Idioma"];

/** RF08: o administrador escolar cadastra, edita (inclusive troca o professor) e exclui disciplinas. */
export function Disciplinas() {
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [aba, setAba] = useState<"cadastro" | "visualizacao">("cadastro");
  const [lista, setLista] = useState<any[] | null>(null);
  const [professores, setProfessores] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const { form, setForm, erros, setErros, alterar } = useFormulario(formInicial);

  const nomeProfessor = useCallback(
    (id: string) => professores.find((p) => String(p.id) === String(id))?.nome ?? "Professor não encontrado",
    [professores]
  );

  const carregar = useCallback(async () => {
    try {
      const [disc, profs] = await Promise.all([api.get("/disciplinas"), api.get("/professores")]);
      setLista(disc.data);
      setProfessores(profs.data);
    } catch (e) {
      setLista([]);
      feedback.erro(lerErro(e, "Não foi possível carregar as disciplinas.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (lista ?? []).filter(
      (d) => !t || `${d.nomeDisciplina} ${d.codigo} ${nomeProfessor(d.professorId)}`.toLowerCase().includes(t)
    );
  }, [lista, busca, nomeProfessor]);

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

  function editar(d: any) {
    setEditando(d);
    setForm({ ...formInicial, ...Object.fromEntries(Object.keys(formInicial).map((c) => [c, String(d[c] ?? "")])) });
    setErros({});
    setAba("cadastro");
  }

  function validar() {
    const e = obrigatorios(form, ROTULOS);
    if (form.cargaHoraria && !validarCargaHoraria(form.cargaHoraria)) {
      e.cargaHoraria = "Carga horária: informe um número inteiro de 1 a 40 horas por semana (ex.: 4).";
    }
    if (!form.professorId) e.professorId = "Escolha o professor responsável pela disciplina.";
    return e;
  }

  async function enviarDisciplina(ev: React.FormEvent) {
    ev.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    if (editando) {
      const mudancas = diferencas(editando, form, ROTULOS, (c, v) => (c === "professorId" ? nomeProfessor(v) : String(v ?? "")));
      if (mudancas.length === 0) {
        feedback.info("Nenhuma informação foi alterada.");
        return;
      }
      const ok = await confirmar({
        titulo: "Salvar alterações da disciplina?",
        mensagem: `Confira as alterações em ${editando.nomeDisciplina}:`,
        detalhes: mudancas,
        textoConfirmar: "Salvar alterações",
      });
      if (!ok) return;
    }

    setSalvando(true);
    try {
      if (editando) {
        await api.patch(`/disciplinas/${editando.id}`, somenteAlterados(editando, form, Object.keys(formInicial)));
        feedback.sucesso(`Disciplina ${form.nomeDisciplina} atualizada com sucesso.`);
        limpar();
        setAba("visualizacao");
      } else {
        await api.post("/disciplinas", form);
        feedback.sucesso(`Disciplina ${form.nomeDisciplina} cadastrada com sucesso.`);
        limpar();
      }
      carregar();
    } catch (e) {
      const { mensagem, campos } = lerErro(e, "Não foi possível salvar a disciplina.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirDisciplina(d: any) {
    const ok = await confirmar({
      titulo: `Excluir a disciplina ${d.nomeDisciplina}?`,
      mensagem: "Esta ação não pode ser desfeita.",
      detalhes: [["Código", d.codigo], ["Professor", nomeProfessor(d.professorId)]],
      textoConfirmar: "Excluir disciplina",
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/disciplinas/${d.id}`);
      feedback.sucesso(`Disciplina ${d.nomeDisciplina} excluída com sucesso.`);
      carregar();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível excluir a disciplina.").mensagem);
    }
  }

  return (
    <>
      <main className="conteudo-principal-disciplinas">
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
            {aba === "cadastro" ? (editando ? "Editar disciplina" : "Cadastro de disciplinas") : "Disciplinas da escola"}
          </h1>
        </div>

        {aba === "cadastro" ? (
          <div className="container-cadastro-disciplinas">
            <form className="formulario-cadastro-disciplinas" onSubmit={enviarDisciplina} noValidate>
              <div className="linha-formulario">
                <CampoTexto id="disc-nome" nome="nomeDisciplina" rotulo="Nome da disciplina:" valor={form.nomeDisciplina} erros={erros} onChange={alterar} placeholder="Ex.: Matemática" />
                <CampoTexto id="disc-carga" nome="cargaHoraria" rotulo="Carga horária semanal (horas):" valor={form.cargaHoraria} erros={erros} onChange={alterar} tipo="number" placeholder="Ex.: 4" />
              </div>
              <div className="linha-formulario">
                <CampoTexto id="disc-codigo" nome="codigo" rotulo="Código da disciplina:" valor={form.codigo} erros={erros} onChange={alterar} placeholder="Ex.: MAT101" dica="Não pode repetir o código de outra disciplina." />
                <div className="campo">
                  <label htmlFor="disc-area">Área do conhecimento:</label>
                  <select id="disc-area" name="areaConhecimento" value={form.areaConhecimento} onChange={alterar} {...propsErro("areaConhecimento", erros)}>
                    <option value="">Selecione...</option>
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                  <CampoErro id="erro-areaConhecimento" mensagem={erros.areaConhecimento} />
                </div>
              </div>
              <div className="linha-formulario">
                <div className="campo">
                  <label htmlFor="disc-descricao">Descrição:</label>
                  <textarea id="disc-descricao" name="descricao" value={form.descricao} onChange={alterar} placeholder="Digite a descrição da disciplina" {...propsErro("descricao", erros)} />
                  <CampoErro id="erro-descricao" mensagem={erros.descricao} />
                </div>
                <div className="campo">
                  <label htmlFor="disc-prof">Professor:</label>
                  <select id="disc-prof" name="professorId" value={form.professorId} onChange={alterar} {...propsErro("professorId", erros)}>
                    <option value="">Selecione um professor</option>
                    {professores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  {professores.length === 0 && <span className="dica-campo">Cadastre um professor antes de criar disciplinas.</span>}
                  <CampoErro id="erro-professorId" mensagem={erros.professorId} />
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
          <div className="container-tabela-disciplinas">
            <div style={{ width: "100%" }}>
              <div className="barra-filtros">
                <label>
                  Buscar disciplina
                  <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, código ou professor" />
                </label>
              </div>
              {lista === null ? (
                <Carregando texto="Carregando disciplinas..." />
              ) : filtradas.length === 0 ? (
                <ListaVazia texto={busca ? "Nenhuma disciplina encontrada para a busca." : "Nenhuma disciplina cadastrada ainda. Use a aba Cadastrar."} />
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela-disciplinas">
                    <thead>
                      <tr>
                        <th scope="col">Disciplina</th>
                        <th scope="col">Código</th>
                        <th scope="col">Carga horária</th>
                        <th scope="col">Área do conhecimento</th>
                        <th scope="col">Professor</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((d) => (
                        <tr key={d.id}>
                          <td>{d.nomeDisciplina}</td>
                          <td>{d.codigo}</td>
                          <td>{d.cargaHoraria}h/semana</td>
                          <td>{d.areaConhecimento}</td>
                          <td>{nomeProfessor(d.professorId)}</td>
                          <td>
                            <div className="acoes-tabela">
                              <button type="button" className="botao-editar" onClick={() => editar(d)} aria-label={`Editar ${d.nomeDisciplina}`}>
                                <FiEdit2 aria-hidden="true" /> Editar
                              </button>
                              <button type="button" className="botao-perigo" onClick={() => excluirDisciplina(d)} aria-label={`Excluir ${d.nomeDisciplina}`}>
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
