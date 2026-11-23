import { useCallback, useEffect, useState } from "react";
import { SidebarAdminSistema } from "./SidebarAdminSistema";
import { FaCheck, FaTimes, FaBuilding, FaUserTie } from "react-icons/fa";
import "./Solicitacoes.css";
import "./pageAdmin.css";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { Carregando, ListaVazia } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import {
  CAMPOS_ESCOLA,
  PORTE_ESCOLA,
  SETOR_EDUCACIONAL,
  STATUS_SOLICITACAO,
  formatarDataHora,
} from "../../utils/formatar";

type Aba = "cadastro" | "edicao" | "remocao";
type FiltroStatus = "PENDENTE" | "APROVADA" | "REJEITADA" | "";

const ROTA: Record<Aba, string> = {
  cadastro: "/solicitacoes-cadastro",
  edicao: "/solicitacoes-edicao",
  remocao: "/solicitacoes-remocao",
};

const NOME_ABA: Record<Aba, string> = { cadastro: "Cadastro", edicao: "Edição", remocao: "Remoção" };

function Selo({ status }: { status: string }) {
  return <span className={`selo selo-${status.toLowerCase()}`}>{STATUS_SOLICITACAO[status] ?? status}</span>;
}

/** RF03: o administrador do sistema consulta, analisa, aprova ou rejeita solicitações. */
export function Solicitacoes() {
  const feedback = useFeedback();
  const { confirmar, avisar } = useConfirm();
  const [aba, setAba] = useState<Aba>("cadastro");
  const [filtro, setFiltro] = useState<FiltroStatus>("PENDENTE");
  const [lista, setLista] = useState<any[] | null>(null);
  const [pendentes, setPendentes] = useState<Record<Aba, number>>({ cadastro: 0, edicao: 0, remocao: 0 });
  const [idProcessando, setIdProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLista(null);
    try {
      const params = filtro ? { status: filtro } : {};
      const [atual, ...contagens] = await Promise.all([
        api.get(ROTA[aba], { params }),
        ...(["cadastro", "edicao", "remocao"] as Aba[]).map((a) => api.get(ROTA[a], { params: { status: "PENDENTE" } })),
      ]);
      setLista(atual.data);
      setPendentes({ cadastro: contagens[0].data.length, edicao: contagens[1].data.length, remocao: contagens[2].data.length });
    } catch (e) {
      setLista([]);
      feedback.erro(lerErro(e, "Não foi possível carregar as solicitações.").mensagem);
    }
  }, [aba, filtro, feedback]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function nomeEscola(item: any) {
    return item.nomeInstituicao ?? item.nomeEscola ?? item.escola?.nome ?? "Escola removida do sistema";
  }

  function resumo(item: any): Array<[string, string]> {
    if (aba === "cadastro") {
      return [
        ["Instituição", item.nomeInstituicao],
        ["CNPJ", item.cnpj],
        ["Representante", `${item.nomeRepresentante} (${item.emailRepresentante})`],
      ];
    }
    if (aba === "edicao") {
      return [
        ["Escola", nomeEscola(item)],
        ["Informação", CAMPOS_ESCOLA[item.informacao] ?? item.informacao],
        ["Valor atual", String(item.valorAtual ?? "—")],
        ["Novo valor", item.alteracao],
      ];
    }
    return [
      ["Escola", nomeEscola(item)],
      ["Justificativa", item.justificativa],
    ];
  }

  async function decidir(item: any, status: "APROVADA" | "REJEITADA") {
    const aprovar = status === "APROVADA";
    const removerEscola = aba === "remocao" && aprovar;
    const mensagens: Record<Aba, string> = {
      cadastro: aprovar
        ? "A escola será cadastrada e o administrador escolar receberá o acesso ao sistema."
        : "O representante será avisado por e-mail de que o cadastro não foi aprovado.",
      edicao: aprovar ? "A informação da escola será alterada para o novo valor." : "A informação da escola não será alterada.",
      remocao: aprovar
        ? "ATENÇÃO: a escola e TODOS os seus dados (professores, alunos, turmas, notas, avisos e relatórios) serão apagados. Esta ação não pode ser desfeita."
        : "A escola continuará cadastrada normalmente.",
    };
    const ok = await confirmar({
      titulo: `${aprovar ? "Aprovar" : "Rejeitar"} solicitação de ${NOME_ABA[aba].toLowerCase()}?`,
      mensagem: mensagens[aba],
      detalhes: resumo(item),
      textoConfirmar: aprovar ? (removerEscola ? "Aprovar e remover escola" : "Aprovar") : "Rejeitar",
      perigo: !aprovar || removerEscola,
    });
    if (!ok) return;

    setIdProcessando(item.id);
    try {
      const { data } = await api.patch(`${ROTA[aba]}/${item.id}/status`, { status });
      feedback.sucesso(
        aprovar ? `Solicitação aprovada: ${nomeEscola(item)}.` : `Solicitação rejeitada: ${nomeEscola(item)}.`
      );
      if (data.senhaTemporaria) {
        await avisar({
          titulo: "Anote a senha do administrador escolar",
          icone: "senha",
          mensagem:
            "O e-mail não pôde ser enviado (modo demonstração). Repasse estes dados ao administrador escolar. A senha não será mostrada de novo.",
          detalhes: [
            ["E-mail", data.emailAdmin],
            ["Senha", data.senhaTemporaria],
          ],
        });
      }
      await carregar();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível registrar a decisão.").mensagem);
    } finally {
      setIdProcessando(null);
    }
  }

  function rodape(item: any) {
    if (item.status !== "PENDENTE") {
      return <p className="texto-ajuda">Decidida em {formatarDataHora(item.dataDecisao)}.</p>;
    }
    const processando = idProcessando === item.id;
    return (
      <div className="card-rodape">
        <button type="button" disabled={processando} onClick={() => decidir(item, "REJEITADA")} className="btn-acao btn-rejeitar">
          <FaTimes aria-hidden="true" /> Rejeitar
        </button>
        <button type="button" disabled={processando} onClick={() => decidir(item, "APROVADA")} className="btn-acao btn-aprovar">
          <FaCheck aria-hidden="true" /> {processando ? "Processando..." : "Aprovar"}
        </button>
      </div>
    );
  }

  return (
    <>
      <main className="paginaAdminSistema">
        <div className="topo">
          <div className="texto">
            <h1>Análise de Solicitações</h1>
            <div className="botoesSol" role="tablist" aria-label="Tipo de solicitação">
              {(["cadastro", "edicao", "remocao"] as Aba[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  role="tab"
                  aria-selected={aba === a}
                  className={aba === a ? "botao-aba ativo" : "botao-aba"}
                  onClick={() => setAba(a)}
                >
                  {NOME_ABA[a]}
                  {pendentes[a] > 0 && <span className="contador-aba"> ({pendentes[a]})</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="conteudo-lista">
          <div className="barra-filtros">
            <label>
              Mostrar
              <select value={filtro} onChange={(e) => setFiltro(e.target.value as FiltroStatus)}>
                <option value="PENDENTE">Somente pendentes</option>
                <option value="APROVADA">Aprovadas</option>
                <option value="REJEITADA">Rejeitadas</option>
                <option value="">Todas</option>
              </select>
            </label>
          </div>

          {lista === null ? (
            <Carregando texto="Carregando solicitações..." />
          ) : lista.length === 0 ? (
            <ListaVazia
              texto={filtro === "PENDENTE" ? "Nenhuma solicitação pendente. Tudo em dia!" : "Nenhuma solicitação encontrada."}
            />
          ) : (
            lista.map((item) => (
              <article key={item.id} className="card-solicitacao">
                <div className="card-cabecalho">
                  <h2 className="card-titulo">{nomeEscola(item)}</h2>
                  <Selo status={item.status} />
                </div>

                {aba === "cadastro" && (
                  <div className="card-corpo">
                    <div className="coluna-dados">
                      <h3 className="titulo-secao">
                        <FaBuilding aria-hidden="true" /> Dados da instituição
                      </h3>
                      <p><strong>CNPJ:</strong> {item.cnpj}</p>
                      <p><strong>Endereço:</strong> {item.endereco}</p>
                      <p><strong>Telefone:</strong> {item.telefone}</p>
                      <p><strong>E-mail:</strong> {item.emailInstituicao}</p>
                      <p><strong>Setor:</strong> {SETOR_EDUCACIONAL[item.setorEducacional] ?? item.setorEducacional}</p>
                      <p><strong>Porte:</strong> {PORTE_ESCOLA[item.numeroAlunos] ?? item.numeroAlunos}</p>
                      <p><strong>Enviada em:</strong> {formatarDataHora(item.dataSolicitacao)}</p>
                    </div>
                    <div className="coluna-dados">
                      <h3 className="titulo-secao">
                        <FaUserTie aria-hidden="true" /> Representante legal
                      </h3>
                      <p><strong>Nome:</strong> {item.nomeRepresentante}</p>
                      <p><strong>CPF:</strong> {item.cpfRepresentante}</p>
                      <p><strong>Cargo:</strong> {item.cargo}</p>
                      <p><strong>E-mail:</strong> {item.emailRepresentante}</p>
                    </div>
                  </div>
                )}

                {aba === "edicao" && (
                  <div className="card-corpo">
                    <div className="coluna-dados">
                      <h3 className="titulo-secao">
                        <FaBuilding aria-hidden="true" /> Informação a ser editada
                      </h3>
                      <p><strong>Campo:</strong> {CAMPOS_ESCOLA[item.informacao] ?? item.informacao}</p>
                      <p><strong>Valor atual:</strong> {String(item.valorAtual ?? "—")}</p>
                      <p><strong>Enviada em:</strong> {formatarDataHora(item.dataSolicitacao)}</p>
                    </div>
                    <div className="coluna-dados">
                      <h3 className="titulo-secao">
                        <FaUserTie aria-hidden="true" /> Alteração desejada
                      </h3>
                      <p><strong>Novo valor:</strong> {item.alteracao}</p>
                    </div>
                  </div>
                )}

                {aba === "remocao" && (
                  <div className="card-corpo">
                    <div className="coluna-dados">
                      <h3 className="titulo-secao">
                        <FaBuilding aria-hidden="true" /> Dados da escola
                      </h3>
                      <p><strong>CNPJ:</strong> {item.escola?.cnpj ?? item.cnpjEscola ?? "—"}</p>
                      <p><strong>Endereço:</strong> {item.escola?.endereco ?? "—"}</p>
                      <p><strong>Telefone:</strong> {item.escola?.telefone ?? "—"}</p>
                      <p><strong>Enviada em:</strong> {formatarDataHora(item.dataSolicitacao)}</p>
                    </div>
                    <div className="coluna-dados">
                      <h3 className="titulo-secao">
                        <FaUserTie aria-hidden="true" /> Justificativa da remoção
                      </h3>
                      <p>{item.justificativa}</p>
                    </div>
                  </div>
                )}

                {rodape(item)}
              </article>
            ))
          )}
        </div>
      </main>
      <SidebarAdminSistema />
    </>
  );
}
