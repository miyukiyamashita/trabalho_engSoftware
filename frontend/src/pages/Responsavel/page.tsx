import { SidebarResponsavel } from "./SidebarResponsavel";
import { FaUserCircle, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Responsavel.css";
import { usePainelResponsavel } from "./usePainel";
import { formatarNota, situacaoNota, NOTA_MAX_FINAL } from "../../utils/notas";
import { formatarDataHora } from "../../utils/formatar";

export default function Responsavel() {
  const { painel, erro, carregando } = usePainelResponsavel();

  const notaGeral = painel?.resumo?.notaGeral ?? null;
  const freq = painel?.resumo?.frequenciaGeral ?? null;
  const proporcaoNota = notaGeral === null ? 0 : Math.min(notaGeral / NOTA_MAX_FINAL, 1);
  const classeNota = { bom: "status-bom", medio: "status-medio", ruim: "status-ruim", sem: "" }[situacaoNota(notaGeral)];
  const classeFreq = freq === null ? "" : freq >= 90 ? "status-bom" : freq >= 75 ? "status-medio" : "status-ruim";

  return (
    <div className="layout-responsavel-container">
      <SidebarResponsavel />

      <main className="conteudo-principal-dashboard">
        <header className="header-bemvindo-card">
          <div className="textos-bemvindo">
            <h1>Olá, bem-vindo(a)!</h1>
            <p>Acompanhe o desempenho escolar com facilidade</p>
          </div>
          <div className="user-profile-top">
            <span>
              Responsável: <strong>{painel?.responsavel?.nome ?? "..."}</strong>
            </span>
            <FaUserCircle className="icone-user-top" aria-hidden="true" />
          </div>
        </header>

        {carregando ? (
          <p className="loading-txt" role="status">Carregando o painel do aluno...</p>
        ) : erro ? (
          <p className="loading-txt" role="alert">{erro}</p>
        ) : !painel?.aluno ? (
          <p className="loading-txt">
            Nenhum aluno está vinculado à sua conta. Procure a secretaria da escola para conferir o e-mail cadastrado.
          </p>
        ) : (
          <>
            <section className="aluno-identificacao-area" aria-label="Aluno">
              <div className="aluno-avatar-circle">
                <FaUserCircle aria-hidden="true" />
              </div>
              <div className="aluno-dados-textos">
                <span className="aluno-label-sub">Aluno</span>
                <h2 className="aluno-nome-destaque">{painel.aluno.nomeAluno}</h2>
                <p className="aluno-serie-sub">
                  {painel.turma ? `${painel.turma.nomeTurma} • ${painel.segmento}` : "Ainda não matriculado em uma turma"}
                </p>
              </div>
            </section>

            <section className="resumo-cards-grid">
              <Link to="/responsavel/notas" className="card-resumo" aria-label={`Nota geral ${formatarNota(notaGeral)} de ${NOTA_MAX_FINAL}. Ver notas`}>
                <span className="card-resumo-titulo">Nota geral (0 a {NOTA_MAX_FINAL})</span>
                <div className="semicirculo-container">
                  <svg className="semicirculo-svg" viewBox="0 0 160 160" aria-hidden="true">
                    <circle className="arco-fundo" cx="80" cy="80" r="63" />
                    <circle className={`arco-progresso ${classeNota}`} cx="80" cy="80" r="63" style={{ strokeDashoffset: 198 - 198 * proporcaoNota }} />
                    <circle className="marcador-ponta" cx="17" cy="80" r="8" style={{ transform: `rotate(${180 * proporcaoNota}deg)` }} />
                  </svg>
                  <span className="valor-centro-arco">{notaGeral === null ? "—" : formatarNota(notaGeral)}</span>
                </div>
                <span className="legenda-card">Média das notas finais (soma dos bimestres)</span>
              </Link>

              <Link to="/responsavel/frequencia" className="card-resumo" aria-label={`Frequência geral ${freq === null ? "sem registros" : `${freq}%`}. Ver frequência`}>
                <span className="card-resumo-titulo">Frequência geral</span>
                <div className="freq-card-conteudo">
                  <span className="freq-valor-texto">{freq === null ? "Sem registros" : `${freq}%`}</span>
                  <div className="barra-freq-fundo" aria-hidden="true">
                    <div className={`barra-freq-cor ${classeFreq}`} style={{ width: `${freq ?? 0}%` }}></div>
                  </div>
                </div>
              </Link>

              <div className="card-resumo card-avisos-mini">
                <span className="card-resumo-titulo">Avisos não lidos</span>
                <div className="avisos-card-conteudo">
                  <div className="avisos-numero-area">
                    <span className="avisos-numero-destaque">{painel.avisos?.naoLidos ?? 0}</span>
                    <Link to="/responsavel/avisos" className="link-ver-avisos">Ver avisos</Link>
                  </div>
                  <div className="avisos-sino-badge" aria-hidden="true">
                    <FaBell />
                  </div>
                </div>
              </div>
            </section>

            <section className="card-ultimos-avisos-lista">
              <h3>Últimos avisos</h3>
              <div className="lista-avisos-container">
                {(painel.avisos?.ultimos ?? []).length === 0 ? (
                  <p className="sem-avisos-txt">Nenhum aviso recente.</p>
                ) : (
                  painel.avisos!.ultimos.map((aviso) => (
                    <div className="item-aviso-linha" key={aviso.id}>
                      <div className="aviso-info-ponto">
                        <span className={`ponto-tipo ${aviso.tipoAviso === "alerta" ? "vermelho" : "azul"}`} aria-hidden="true"></span>
                        <div>
                          <h4>
                            {aviso.tipoAviso === "alerta" ? "Alerta: " : ""}
                            {aviso.tituloAviso}
                            {!aviso.lido && <span className="selo selo-pendente" style={{ marginLeft: 8 }}>Não lido</span>}
                          </h4>
                          <p>{aviso.descricao}</p>
                        </div>
                      </div>
                      <span className="data-aviso-texto">{formatarDataHora(aviso.dataCriacao)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="rodape-lista-avisos">
                <Link to="/responsavel/avisos" className="btn-texto-primario">Ver todos os avisos</Link>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
