import { useCallback, useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { SidebarResponsavel } from "./SidebarResponsavel";
import "./avisosAlunos.css";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { Carregando, ListaVazia } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import { formatarDataHora } from "../../utils/formatar";

type Filtro = "todos" | "nao-lidos" | "lidos";

/** RF13: o responsável vê os avisos das turmas do filho e confirma a leitura. */
export function AvisosAlunos() {
  const feedback = useFeedback();
  const [filtro, setFiltro] = useState<Filtro>("nao-lidos");
  const [avisos, setAvisos] = useState<any[] | null>(null);
  const [marcando, setMarcando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get("/avisos");
      setAvisos(data);
    } catch (e) {
      setAvisos((atual) => atual ?? []);
      feedback.erro(lerErro(e, "Não foi possível carregar os avisos.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    carregar();
    const intervalo = window.setInterval(carregar, 30000);
    return () => window.clearInterval(intervalo);
  }, [carregar]);

  async function marcarComoLido(aviso: any) {
    setMarcando(aviso.id);
    try {
      await api.patch(`/avisos/${aviso.id}/leitura`);
      setAvisos((lista) => (lista ?? []).map((a) => (a.id === aviso.id ? { ...a, lido: true } : a)));
      feedback.sucesso(`Leitura confirmada: "${aviso.tituloAviso}". A escola já pode ver que você leu.`);
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível confirmar a leitura. Tente novamente.").mensagem);
    } finally {
      setMarcando(null);
    }
  }

  const lista = avisos ?? [];
  const totalNaoLidos = lista.filter((a) => !a.lido).length;
  const filtrados = lista.filter((a) => (filtro === "nao-lidos" ? !a.lido : filtro === "lidos" ? a.lido : true));

  const botao = (valor: Filtro, rotulo: string, contador?: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={filtro === valor}
      className={filtro === valor ? "botao-filtro ativo" : "botao-filtro"}
      onClick={() => setFiltro(valor)}
    >
      {rotulo} {contador ? <span className="contador">{contador}</span> : null}
    </button>
  );

  return (
    <>
      <main className="conteudo-principal-responsavel">
        <h1>Avisos</h1>
        <p className="texto-ajuda">
          Avisos enviados pela escola e pelos professores. Depois de ler, toque em "Confirmar leitura" para avisar a escola.
        </p>
        <div className="botoes-filtros-responsavel" role="tablist" aria-label="Filtrar avisos">
          {botao("nao-lidos", "Não lidos", totalNaoLidos)}
          {botao("lidos", "Lidos")}
          {botao("todos", "Todos")}
        </div>
        <div className="box-borda-avisos-responsavel">
          <div className="box-scroll-avisos-aluno">
            {avisos === null ? (
              <Carregando texto="Carregando avisos..." />
            ) : filtrados.length === 0 ? (
              <ListaVazia
                texto={filtro === "nao-lidos" ? "Você não tem avisos para ler. Tudo em dia!" : "Nenhum aviso encontrado nesta categoria."}
              />
            ) : (
              filtrados.map((aviso) => (
                <article className="linha-aviso-responsavel" key={aviso.id}>
                  <div className="aviso-esquerda">
                    <span className={`bolinha-status ${aviso.tipoAviso === "alerta" ? "vermelha" : "azul"}`} aria-hidden="true"></span>
                    <div className="aviso-textos">
                      <h2 className="titulo-aviso">
                        {aviso.tipoAviso === "alerta" && <span className="selo selo-rejeitada">Alerta</span>} {aviso.tituloAviso}
                      </h2>
                      <p>{aviso.descricao}</p>
                      {aviso.nomeRemetente && <span className="aviso-data">Enviado por {aviso.nomeRemetente}</span>}
                    </div>
                  </div>
                  <div className="aviso-direita-responsavel">
                    <span className="aviso-data">{formatarDataHora(aviso.dataCriacao)}</span>
                    {aviso.lido ? (
                      <span className="selo selo-aprovada">
                        <FiCheck aria-hidden="true" /> Lido
                      </span>
                    ) : (
                      <button type="button" className="botao-marcar-lido" disabled={marcando === aviso.id} onClick={() => marcarComoLido(aviso)}>
                        {marcando === aviso.id ? "Confirmando..." : "Confirmar leitura"}
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </main>
      <SidebarResponsavel />
    </>
  );
}
