import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./pageEscolar.css";
import "./escola.css";
import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, Carregando, propsErro } from "../../components/Campos";
import { useFormulario } from "../../components/Formulario";
import { lerErro } from "../../utils/erros";
import { CAMPOS_ESCOLA, PORTE_ESCOLA, SETOR_EDUCACIONAL } from "../../utils/formatar";

const formInicialEdicao = { informacao: "", alteracao: "" };
const formInicialRemocao = { justificativa: "" };

/** RF05: o administrador escolar consulta a escola e solicita edição ou remoção. */
export function Escola() {
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [aba, setAba] = useState<"edicao" | "remocao">("edicao");
  const [escola, setEscola] = useState<any>(null);
  const [enviando, setEnviando] = useState(false);
  const edicao = useFormulario(formInicialEdicao);
  const remocao = useFormulario(formInicialRemocao);

  useEffect(() => {
    api
      .get("/escolas/minha")
      .then((r) => setEscola(r.data))
      .catch((e) => feedback.erro(lerErro(e, "Não foi possível carregar a escola.").mensagem));
  }, [feedback]);

  const exibir = (campo: string, valor: any) =>
    campo === "setorEducacional" ? SETOR_EDUCACIONAL[valor] ?? valor : campo === "numeroAlunos" ? PORTE_ESCOLA[valor] ?? valor : valor ?? "—";

  const valorAtual = edicao.form.informacao ? exibir(edicao.form.informacao, escola?.[edicao.form.informacao]) : "";

  async function enviarSolicitacaoEdicao(e: React.FormEvent) {
    e.preventDefault();
    const erros: Record<string, string> = {};
    if (!edicao.form.informacao) erros.informacao = "Escolha qual informação da escola deve ser alterada.";
    if (!edicao.form.alteracao.trim()) erros.alteracao = "Informe o novo valor desejado.";
    edicao.setErros(erros);
    if (Object.keys(erros).length > 0) {
      feedback.erro("Preencha os campos destacados para enviar a solicitação.");
      return;
    }
    setEnviando(true);
    try {
      await api.post("/solicitacoes-edicao", edicao.form);
      feedback.sucesso("Solicitação de edição enviada! O administrador do sistema vai analisar o pedido.");
      edicao.setForm(formInicialEdicao);
    } catch (erro) {
      const { mensagem, campos } = lerErro(erro, "Não foi possível enviar a solicitação.");
      edicao.setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarSolicitacaoRemocao(e: React.FormEvent) {
    e.preventDefault();
    if (remocao.form.justificativa.trim().length < 10) {
      remocao.setErros({ justificativa: "Explique o motivo da remoção com pelo menos 10 caracteres." });
      feedback.erro("Preencha a justificativa para enviar a solicitação.");
      return;
    }
    const ok = await confirmar({
      titulo: "Pedir a remoção da escola?",
      mensagem:
        "Se o administrador do sistema aprovar, a escola e todos os dados dela (professores, alunos, turmas, notas, avisos e relatórios) serão apagados definitivamente.",
      detalhes: [["Escola", escola?.nome ?? ""], ["Justificativa", remocao.form.justificativa]],
      textoConfirmar: "Enviar pedido de remoção",
      perigo: true,
    });
    if (!ok) return;
    setEnviando(true);
    try {
      await api.post("/solicitacoes-remocao", remocao.form);
      feedback.sucesso("Solicitação de remoção enviada. O administrador do sistema vai analisar o pedido.");
      remocao.setForm(formInicialRemocao);
    } catch (erro) {
      const { mensagem, campos } = lerErro(erro, "Não foi possível enviar a solicitação.");
      remocao.setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <main className="conteudo-principal-solEscolas">
        <div className="cabecalho-abas-solEscolas">
          <h1 className="titulo-pagina">{aba === "edicao" ? "Solicitação de edição" : "Solicitação de remoção"}</h1>
          <div className="botoes-alternador-solEscolas" role="tablist" aria-label="Tipo de solicitação">
            <button type="button" role="tab" aria-selected={aba === "edicao"} className={aba === "edicao" ? "botao-aba ativo" : "botao-aba"} onClick={() => setAba("edicao")}>
              Edição
            </button>
            <button type="button" role="tab" aria-selected={aba === "remocao"} className={aba === "remocao" ? "botao-aba ativo" : "botao-aba"} onClick={() => setAba("remocao")}>
              Remoção
            </button>
          </div>
        </div>

        {!escola ? (
          <Carregando texto="Carregando dados da escola..." />
        ) : aba === "edicao" ? (
          <div className="container-edicao">
            <div className="container-tabela-escola">
              <div className="tabela-wrapper">
                <table className="tabela-escola">
                  <thead>
                    <tr>
                      <th scope="col">Nome - CNPJ</th>
                      <th scope="col">Endereço</th>
                      <th scope="col">Telefone</th>
                      <th scope="col">Setor educacional</th>
                      <th scope="col">Número de alunos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{escola.nome} - {escola.cnpj}</td>
                      <td>{escola.endereco}</td>
                      <td>{escola.telefone}</td>
                      <td>{exibir("setorEducacional", escola.setorEducacional)}</td>
                      <td>{exibir("numeroAlunos", escola.numeroAlunos)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <form className="envio-solicitacao-edicao" onSubmit={enviarSolicitacaoEdicao} noValidate>
              <p className="texto-ajuda">
                Escolha a informação que está errada e digite o valor correto. A alteração só vale depois de aprovada
                pelo administrador do sistema.
              </p>
              <div className="linha-formulario">
                <div className="campo">
                  <label htmlFor="edicao-informacao">Informação:</label>
                  <select id="edicao-informacao" name="informacao" value={edicao.form.informacao} onChange={edicao.alterar} {...propsErro("informacao", edicao.erros)}>
                    <option value="">Selecione...</option>
                    {Object.entries(CAMPOS_ESCOLA).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>{rotulo}</option>
                    ))}
                  </select>
                  {valorAtual && <span className="dica-campo">Valor atual: {String(valorAtual)}</span>}
                  <CampoErro id="erro-informacao" mensagem={edicao.erros.informacao} />
                </div>

                <div className="campo">
                  <label htmlFor="edicao-alteracao">Novo valor:</label>
                  {edicao.form.informacao === "setorEducacional" || edicao.form.informacao === "numeroAlunos" ? (
                    <select id="edicao-alteracao" name="alteracao" value={edicao.form.alteracao} onChange={edicao.alterar} {...propsErro("alteracao", edicao.erros)}>
                      <option value="">Selecione...</option>
                      {Object.entries(edicao.form.informacao === "setorEducacional" ? SETOR_EDUCACIONAL : PORTE_ESCOLA).map(([v, r]) => (
                        <option key={v} value={v}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" id="edicao-alteracao" name="alteracao" value={edicao.form.alteracao} onChange={edicao.alterar} placeholder="Digite a nova informação" {...propsErro("alteracao", edicao.erros)} />
                  )}
                  <CampoErro id="erro-alteracao" mensagem={edicao.erros.alteracao} />
                </div>
              </div>

              <div className="acoes-formulario">
                <button type="button" className="botao-secundario" onClick={() => { edicao.setForm(formInicialEdicao); edicao.setErros({}); }}>
                  Cancelar
                </button>
                <button type="submit" className="botao-primario" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar solicitação"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="container-remover-escola">
            <form className="envio-solicitacao-remocao" onSubmit={enviarSolicitacaoRemocao} noValidate>
              <div className="campo">
                <label htmlFor="remocao-justificativa">Justificativa para a remoção da escola:</label>
                <textarea
                  id="remocao-justificativa"
                  name="justificativa"
                  value={remocao.form.justificativa}
                  onChange={remocao.alterar}
                  placeholder="Explique por que a escola deve ser removida do sistema..."
                  rows={7}
                  {...propsErro("justificativa", remocao.erros)}
                />
                <CampoErro id="erro-justificativa" mensagem={remocao.erros.justificativa} />
              </div>
              <div className="acoes-formulario">
                <button type="button" className="botao-secundario" onClick={() => { remocao.setForm(formInicialRemocao); remocao.setErros({}); setAba("edicao"); }}>
                  Cancelar
                </button>
                <button type="submit" className="botao-perigo" disabled={enviando}>
                  {enviando ? "Enviando..." : "Pedir remoção"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
      <SidebarAdminEscolar />
    </>
  );
}
