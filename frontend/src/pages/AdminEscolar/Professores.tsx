import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./pageEscolar.css";
import "./professores.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { Carregando, ListaVazia } from "../../components/Campos";
import { CampoTexto, diferencas, somenteAlterados, useFormulario } from "../../components/Formulario";
import { lerErro } from "../../utils/erros";
import { formatarData, hojeISO } from "../../utils/formatar";
import { MSG, obrigatorios, validarCPF, validarDataPassada, validarEmail, validarTelefone } from "../../utils/validadores";

const formInicial = { nome: "", cpf: "", dataNascimento: "", email: "", telefone: "", formacao: "" };
const ROTULOS = {
  nome: "Nome completo",
  cpf: "CPF",
  dataNascimento: "Data de nascimento",
  email: "E-mail",
  telefone: "Telefone",
  formacao: "Formação",
};

/** RF06: o administrador escolar cadastra, edita e exclui professores. */
export function Professores() {
  const feedback = useFeedback();
  const { confirmar, avisar } = useConfirm();
  const [aba, setAba] = useState<"cadastro" | "visualizacao">("cadastro");
  const [lista, setLista] = useState<any[] | null>(null);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const { form, setForm, erros, setErros, alterar } = useFormulario(formInicial);

  const buscarProfessores = useCallback(async () => {
    try {
      const { data } = await api.get("/professores");
      setLista(data);
    } catch (e) {
      setLista([]);
      feedback.erro(lerErro(e, "Não foi possível carregar a lista de professores.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    if (aba === "visualizacao") buscarProfessores();
  }, [aba, buscarProfessores]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (lista ?? []).filter((p) => !t || `${p.nome} ${p.cpf} ${p.email}`.toLowerCase().includes(t));
  }, [lista, busca]);

  function limpar() {
    setForm(formInicial);
    setErros({});
    setEditando(null);
  }

  function cancelar() {
    const voltarParaLista = Boolean(editando);
    limpar();
    if (voltarParaLista) setAba("visualizacao");
  }

  function editar(prof: any) {
    setEditando(prof);
    setForm({ ...formInicial, ...Object.fromEntries(Object.keys(formInicial).map((c) => [c, prof[c] ?? ""])) });
    setErros({});
    setAba("cadastro");
  }

  function validar() {
    const e = obrigatorios(form, ROTULOS);
    if (form.cpf && !validarCPF(form.cpf)) e.cpf = MSG.cpf;
    if (form.telefone && !validarTelefone(form.telefone)) e.telefone = MSG.telefone;
    if (form.email && !validarEmail(form.email)) e.email = MSG.email;
    if (form.dataNascimento && !validarDataPassada(form.dataNascimento)) e.dataNascimento = MSG.data;
    return e;
  }

  async function enviarProfessor(ev: React.FormEvent) {
    ev.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    if (editando) {
      const mudancas = diferencas(editando, form, ROTULOS, (c, v) => (c === "dataNascimento" ? formatarData(v) : String(v ?? "")));
      if (mudancas.length === 0) {
        feedback.info("Nenhuma informação foi alterada.");
        return;
      }
      const ok = await confirmar({
        titulo: "Salvar alterações do professor?",
        mensagem: `Confira as alterações em ${editando.nome}:`,
        detalhes: mudancas,
        textoConfirmar: "Salvar alterações",
      });
      if (!ok) return;
    }

    setSalvando(true);
    try {
      if (editando) {
        await api.patch(`/professores/${editando.id}`, somenteAlterados(editando, form, Object.keys(formInicial)));
        feedback.sucesso(`Dados de ${form.nome} atualizados com sucesso.`);
        limpar();
        setAba("visualizacao");
      } else {
        const { data } = await api.post("/professores", form);
        feedback.sucesso(`Professor ${data.nome} cadastrado com sucesso.`);
        limpar();
        if (data.senhaTemporaria) {
          await avisar({
            titulo: "Anote a senha do professor",
            icone: "senha",
            mensagem: "O e-mail não pôde ser enviado (modo demonstração). Repasse estes dados ao professor. A senha não será mostrada de novo.",
            detalhes: [["E-mail", data.email], ["Senha", data.senhaTemporaria]],
          });
        } else if (data.emailEnviado) {
          feedback.info(`A senha de acesso foi enviada para ${data.email}.`);
        }
      }
    } catch (e) {
      const { mensagem, campos } = lerErro(e, "Não foi possível salvar o professor.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProfessor(prof: any) {
    const ok = await confirmar({
      titulo: `Excluir o professor ${prof.nome}?`,
      mensagem: "O acesso dele ao sistema também será removido. Esta ação não pode ser desfeita.",
      detalhes: [["CPF", prof.cpf], ["E-mail", prof.email]],
      textoConfirmar: "Excluir professor",
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/professores/${prof.id}`);
      feedback.sucesso(`Professor ${prof.nome} excluído com sucesso.`);
      buscarProfessores();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível excluir o professor.").mensagem);
    }
  }

  const campo = (nome: keyof typeof formInicial, tipo = "text", placeholder = "", dica?: string) => (
    <CampoTexto
      id={`prof-${nome}`}
      nome={nome}
      rotulo={`${ROTULOS[nome]}:`}
      valor={form[nome]}
      erros={erros}
      onChange={alterar}
      tipo={tipo}
      placeholder={placeholder}
      dica={dica}
      max={tipo === "date" ? hojeISO() : undefined}
    />
  );

  return (
    <>
      <main className="conteudo-principal">
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
            {aba === "cadastro" ? (editando ? "Editar professor" : "Cadastro de professores") : "Professores da escola"}
          </h1>
        </div>

        {aba === "cadastro" ? (
          <div className="container-cadastro-professores">
            <form className="formulario-cadastro-professores" onSubmit={enviarProfessor} noValidate>
              <div className="linha-formulario">
                {campo("nome", "text", "Digite o nome do professor")}
                {campo("cpf", "text", "000.000.000-00")}
              </div>
              <div className="linha-formulario">
                {campo("dataNascimento", "date")}
                {campo("email", "email", "email@exemplo.com", "Será usado para entrar no sistema.")}
              </div>
              <div className="linha-formulario">
                {campo("telefone", "tel", "(00) 00000-0000")}
                {campo("formacao", "text", "Ex.: Licenciatura em Matemática")}
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
          <div className="container-tabela-professores">
            <div style={{ width: "100%" }}>
              <div className="barra-filtros">
                <label>
                  Buscar professor
                  <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, CPF ou e-mail" />
                </label>
              </div>
              {lista === null ? (
                <Carregando texto="Carregando professores..." />
              ) : filtrados.length === 0 ? (
                <ListaVazia texto={busca ? "Nenhum professor encontrado para a busca." : "Nenhum professor cadastrado ainda. Use a aba Cadastrar."} />
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela-professores">
                    <thead>
                      <tr>
                        <th scope="col">Professor - CPF</th>
                        <th scope="col">E-mail</th>
                        <th scope="col">Telefone</th>
                        <th scope="col">Formação</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((prof) => (
                        <tr key={prof.id}>
                          <td>{prof.nome} - {prof.cpf}</td>
                          <td>{prof.email}</td>
                          <td>{prof.telefone}</td>
                          <td>{prof.formacao}</td>
                          <td>
                            <div className="acoes-tabela">
                              <button type="button" className="botao-editar" onClick={() => editar(prof)} aria-label={`Editar ${prof.nome}`}>
                                <FiEdit2 aria-hidden="true" /> Editar
                              </button>
                              <button type="button" className="botao-perigo" onClick={() => excluirProfessor(prof)} aria-label={`Excluir ${prof.nome}`}>
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
