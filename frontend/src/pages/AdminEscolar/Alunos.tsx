import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./pageEscolar.css";
import "./alunos.css";
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

const formInicial = {
  nomeAluno: "",
  cpfAluno: "",
  dataNascimentoAluno: "",
  nomeResponsavel: "",
  emailResponsavel: "",
  telefoneResponsavel: "",
};
const ROTULOS = {
  nomeAluno: "Nome completo do aluno",
  cpfAluno: "CPF do aluno",
  dataNascimentoAluno: "Data de nascimento",
  nomeResponsavel: "Nome do responsável",
  emailResponsavel: "E-mail do responsável",
  telefoneResponsavel: "Telefone do responsável",
};

/** RF09: o administrador escolar cadastra, edita e exclui alunos, com os dados do responsável. */
export function Alunos() {
  const feedback = useFeedback();
  const { confirmar, avisar } = useConfirm();
  const [aba, setAba] = useState<"cadastro" | "visualizacao">("cadastro");
  const [lista, setLista] = useState<any[] | null>(null);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const { form, setForm, erros, setErros, alterar } = useFormulario(formInicial);

  const buscarAlunos = useCallback(async () => {
    try {
      const { data } = await api.get("/alunos");
      setLista(data);
    } catch (e) {
      setLista([]);
      feedback.erro(lerErro(e, "Não foi possível carregar a lista de alunos.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    if (aba === "visualizacao") buscarAlunos();
  }, [aba, buscarAlunos]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (lista ?? []).filter(
      (a) => !t || `${a.nomeAluno} ${a.cpfAluno} ${a.nomeResponsavel} ${a.emailResponsavel}`.toLowerCase().includes(t)
    );
  }, [lista, busca]);

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

  function editar(aluno: any) {
    setEditando(aluno);
    setForm({ ...formInicial, ...Object.fromEntries(Object.keys(formInicial).map((c) => [c, aluno[c] ?? ""])) });
    setErros({});
    setAba("cadastro");
  }

  function validar() {
    const e = obrigatorios(form, ROTULOS);
    if (form.cpfAluno && !validarCPF(form.cpfAluno)) e.cpfAluno = MSG.cpf;
    if (form.telefoneResponsavel && !validarTelefone(form.telefoneResponsavel)) e.telefoneResponsavel = MSG.telefone;
    if (form.emailResponsavel && !validarEmail(form.emailResponsavel)) e.emailResponsavel = MSG.email;
    if (form.dataNascimentoAluno && !validarDataPassada(form.dataNascimentoAluno)) e.dataNascimentoAluno = MSG.data;
    return e;
  }

  async function mostrarSenha(email: string, senha: string) {
    await avisar({
      titulo: "Anote a senha do responsável",
      icone: "senha",
      mensagem: "O e-mail não pôde ser enviado (modo demonstração). Repasse estes dados ao responsável. A senha não será mostrada de novo.",
      detalhes: [["E-mail", email], ["Senha", senha]],
    });
  }

  async function enviarAluno(ev: React.FormEvent) {
    ev.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    if (editando) {
      const mudancas = diferencas(editando, form, ROTULOS, (c, v) => (c === "dataNascimentoAluno" ? formatarData(v) : String(v ?? "")));
      if (mudancas.length === 0) {
        feedback.info("Nenhuma informação foi alterada.");
        return;
      }
      const trocaEmail = String(editando.emailResponsavel) !== String(form.emailResponsavel).trim().toLowerCase();
      const ok = await confirmar({
        titulo: "Salvar alterações do aluno?",
        mensagem: trocaEmail
          ? `Confira as alterações em ${editando.nomeAluno}. O responsável passará a entrar com o novo e-mail.`
          : `Confira as alterações em ${editando.nomeAluno}:`,
        detalhes: mudancas,
        textoConfirmar: "Salvar alterações",
      });
      if (!ok) return;
    }

    setSalvando(true);
    try {
      if (editando) {
        const { data } = await api.patch(`/alunos/${editando.id}`, somenteAlterados(editando, form, Object.keys(formInicial)));
        feedback.sucesso(`Dados de ${form.nomeAluno} atualizados com sucesso.`);
        limpar();
        setAba("visualizacao");
        if (data.senhaTemporaria) await mostrarSenha(data.emailResponsavel, data.senhaTemporaria);
      } else {
        const { data } = await api.post("/alunos", form);
        feedback.sucesso(`Aluno ${data.nomeAluno} cadastrado com sucesso.`);
        limpar();
        if (data.responsavelJaTinhaAcesso) {
          feedback.info(`O responsável ${data.nomeResponsavel} já tinha acesso: o aluno foi vinculado à mesma conta.`);
        } else if (data.senhaTemporaria) {
          await mostrarSenha(data.emailResponsavel, data.senhaTemporaria);
        } else if (data.emailEnviado) {
          feedback.info(`A senha de acesso foi enviada para ${data.emailResponsavel}.`);
        }
      }
    } catch (e) {
      const { mensagem, campos } = lerErro(e, "Não foi possível salvar o aluno.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirAluno(aluno: any) {
    const ok = await confirmar({
      titulo: `Excluir o aluno ${aluno.nomeAluno}?`,
      mensagem:
        "Se o responsável não tiver outro aluno na escola, o acesso dele ao sistema também será removido. Esta ação não pode ser desfeita.",
      detalhes: [["CPF", aluno.cpfAluno], ["Responsável", aluno.nomeResponsavel]],
      textoConfirmar: "Excluir aluno",
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/alunos/${aluno.id}`);
      feedback.sucesso(`Aluno ${aluno.nomeAluno} excluído com sucesso.`);
      buscarAlunos();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível excluir o aluno.").mensagem);
    }
  }

  const campo = (nome: keyof typeof formInicial, tipo = "text", placeholder = "", dica?: string) => (
    <CampoTexto
      id={`aluno-${nome}`}
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
            {aba === "cadastro" ? (editando ? "Editar aluno" : "Cadastro de alunos") : "Alunos da escola"}
          </h1>
        </div>

        {aba === "cadastro" ? (
          <div className="container-cadastro-alunos">
            <form className="formulario-cadastro-alunos" onSubmit={enviarAluno} noValidate>
              <div className="linha-formulario">
                {campo("nomeAluno", "text", "Digite o nome do aluno")}
                {campo("cpfAluno", "text", "000.000.000-00")}
              </div>
              <div className="linha-formulario">
                {campo("dataNascimentoAluno", "date")}
                {campo("nomeResponsavel", "text", "Digite o nome do responsável")}
              </div>
              <div className="linha-formulario">
                {campo("emailResponsavel", "email", "email@exemplo.com", "O responsável entra no sistema com este e-mail.")}
                {campo("telefoneResponsavel", "tel", "(00) 00000-0000")}
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
          <div className="container-tabela-alunos">
            <div style={{ width: "100%" }}>
              <div className="barra-filtros">
                <label>
                  Buscar aluno
                  <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, CPF ou responsável" />
                </label>
              </div>
              {lista === null ? (
                <Carregando texto="Carregando alunos..." />
              ) : filtrados.length === 0 ? (
                <ListaVazia texto={busca ? "Nenhum aluno encontrado para a busca." : "Nenhum aluno cadastrado ainda. Use a aba Cadastrar."} />
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela-alunos">
                    <thead>
                      <tr>
                        <th scope="col">Aluno - CPF</th>
                        <th scope="col">Nascimento</th>
                        <th scope="col">Responsável</th>
                        <th scope="col">E-mail do responsável</th>
                        <th scope="col">Telefone</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((aluno) => (
                        <tr key={aluno.id}>
                          <td>{aluno.nomeAluno} - {aluno.cpfAluno}</td>
                          <td>{formatarData(aluno.dataNascimentoAluno)}</td>
                          <td>{aluno.nomeResponsavel}</td>
                          <td>{aluno.emailResponsavel}</td>
                          <td>{aluno.telefoneResponsavel}</td>
                          <td>
                            <div className="acoes-tabela">
                              <button type="button" className="botao-editar" onClick={() => editar(aluno)} aria-label={`Editar ${aluno.nomeAluno}`}>
                                <FiEdit2 aria-hidden="true" /> Editar
                              </button>
                              <button type="button" className="botao-perigo" onClick={() => excluirAluno(aluno)} aria-label={`Excluir ${aluno.nomeAluno}`}>
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
