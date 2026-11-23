import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { SidebarResponsavel } from "./SidebarResponsavel";
import "../AdminEscolar/RelatorioFinalAdminEscolar.css";
import relatorio from "../../assets/relatorio.png";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { Carregando } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import { formatarDataHora } from "../../utils/formatar";

type Situacao = { aluno: { id: string; nomeAluno: string } | null; disponivel: boolean; disponibilizadoEm: string | null };

/** RF14: o responsável baixa o relatório final do filho quando a escola o disponibiliza. */
export function RelatorioFinalAlunos() {
  const feedback = useFeedback();
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    api
      .get("/relatorios/meu")
      .then((r) => setSituacao(r.data))
      .catch((e) => {
        setSituacao({ aluno: null, disponivel: false, disponibilizadoEm: null });
        feedback.erro(lerErro(e, "Não foi possível consultar o relatório.").mensagem);
      });
  }, [feedback]);

  async function baixar() {
    setBaixando(true);
    try {
      // Download autenticado: o arquivo só vem se o aluno for filho do responsável logado.
      const resposta = await api.get("/relatorios/meu/arquivo", { responseType: "blob" });
      const url = URL.createObjectURL(resposta.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Relatorio_Final_${(situacao?.aluno?.nomeAluno ?? "aluno").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      feedback.sucesso("Download do relatório iniciado.");
    } catch (e) {
      const { status } = lerErro(e);
      feedback.erro(status === 404 ? "Relatório ainda não disponível." : "Não foi possível baixar o relatório. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  return (
    <>
      <main className="pagRelatorio">
        <div className="topo">
          <h1>Relatório Final</h1>
        </div>

        {!situacao ? (
          <Carregando texto="Consultando o relatório..." />
        ) : (
          <>
            <div className="imagem">
              <img src={relatorio} alt="" className="relatorio" />
            </div>
            <div className="relatorio-situacao" role="status">
              {!situacao.aluno ? (
                <p className="feedback-erro-txt">Nenhum aluno está vinculado à sua conta. Procure a secretaria da escola.</p>
              ) : situacao.disponivel ? (
                <p>
                  O relatório final de <strong>{situacao.aluno.nomeAluno}</strong> foi disponibilizado pela escola em{" "}
                  {formatarDataHora(situacao.disponibilizadoEm)}.
                </p>
              ) : (
                <p>
                  <strong>Relatório ainda não disponível.</strong> A escola ainda não publicou o relatório final de{" "}
                  {situacao.aluno.nomeAluno}. Volte a esta página mais tarde.
                </p>
              )}
            </div>
            <div className="botao-gerar-relatorio">
              <button type="button" onClick={baixar} disabled={baixando || !situacao.disponivel}>
                <FiDownload aria-hidden="true" /> {baixando ? "Baixando..." : "Baixar relatório (PDF)"}
              </button>
            </div>
          </>
        )}
      </main>
      <SidebarResponsavel />
    </>
  );
}
