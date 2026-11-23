import { useCallback, useEffect, useState } from "react";
import { FiFileText } from "react-icons/fi";
import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./RelatorioFinalAdminEscolar.css";
import relatorio from "../../assets/relatorio.png";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { Carregando, ListaVazia } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import { formatarDataHora } from "../../utils/formatar";

const kb = (bytes: number | null) => (bytes ? `${(bytes / 1024).toFixed(1).replace(".", ",")} KB` : "—");

/** RF14: o administrador escolar gera e disponibiliza o relatório final para os responsáveis. */
export function RelatorioFinalAdminEscolar() {
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [lista, setLista] = useState<any[] | null>(null);
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get("/relatorios");
      setLista(data);
    } catch (e) {
      setLista([]);
      feedback.erro(lerErro(e, "Não foi possível carregar a situação dos relatórios.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const jaGerados = (lista ?? []).filter((r) => r.disponibilizadoEm).length;

  async function gerar() {
    const ok = await confirmar({
      titulo: "Gerar e disponibilizar os relatórios finais?",
      mensagem:
        "Será gerado um PDF para cada aluno da escola com as notas e a frequência atuais. Os responsáveis poderão baixar o relatório logo em seguida.",
      detalhes: [
        ["Alunos", String(lista?.length ?? 0)],
        ["Relatórios já disponíveis", jaGerados > 0 ? `${jaGerados} (serão substituídos pela versão atual)` : "nenhum"],
      ],
      textoConfirmar: "Gerar e disponibilizar",
    });
    if (!ok) return;

    setGerando(true);
    try {
      const { data } = await api.post("/relatorios/gerar");
      feedback.sucesso(
        `${data.total} relatório(s) gerado(s) e disponibilizado(s) aos responsáveis. Maior arquivo: ${kb(data.maiorTamanhoBytes)} (limite de 5 MB).`
      );
      carregar();
    } catch (e) {
      feedback.erro(lerErro(e, "Ocorreu um erro ao gerar os relatórios. Tente novamente.").mensagem);
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <main className="pagRelatorio">
        <div className="topo">
          <h1>Relatório Final</h1>
        </div>
        <p className="texto-ajuda">
          O relatório reúne a nota final (soma dos bimestres, de 0 a 100) e a frequência de cada disciplina. Gere de
          novo sempre que quiser publicar as notas mais recentes.
        </p>

        <div className="imagem">
          <img src={relatorio} alt="" className="relatorio" />
        </div>

        <div className="botao-gerar-relatorio">
          <button type="button" onClick={gerar} disabled={gerando || !lista || lista.length === 0}>
            <FiFileText aria-hidden="true" /> {gerando ? "Gerando documentos..." : "Gerar e disponibilizar relatórios"}
          </button>
        </div>

        <h2 className="subtitulo-relatorios">Situação por aluno</h2>
        {lista === null ? (
          <Carregando texto="Carregando situação dos relatórios..." />
        ) : lista.length === 0 ? (
          <ListaVazia texto="Nenhum aluno cadastrado na escola." />
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela-relatorios">
              <thead>
                <tr>
                  <th scope="col">Aluno</th>
                  <th scope="col">Situação</th>
                  <th scope="col">Disponibilizado em</th>
                  <th scope="col">Tamanho</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((r) => (
                  <tr key={r.alunoId}>
                    <td>{r.nomeAluno}</td>
                    <td>
                      <span className={`selo ${r.disponibilizadoEm ? "selo-aprovada" : "selo-pendente"}`}>
                        {r.disponibilizadoEm ? "Disponível para o responsável" : "Ainda não gerado"}
                      </span>
                    </td>
                    <td>{formatarDataHora(r.disponibilizadoEm)}</td>
                    <td>{kb(r.tamanhoBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <SidebarAdminEscolar />
    </>
  );
}
