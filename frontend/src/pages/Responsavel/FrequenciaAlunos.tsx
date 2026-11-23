import { SidebarResponsavel } from "./SidebarResponsavel";
import { useMemo, useState } from "react";
import "./Frequencia.css";
import "../Prof/Notas.css";
import { situacaoFrequencia, usePainelResponsavel } from "./usePainel";
import { Carregando, ListaVazia } from "../../components/Campos";
import { formatarData, hojeISO } from "../../utils/formatar";

const CLASSES: Record<string, { texto: string; bg: string }> = {
  excelente: { texto: "texto-excelente", bg: "bg-excelente" },
  atencao: { texto: "texto-atencao", bg: "bg-atencao" },
  critico: { texto: "texto-critico", bg: "bg-critico" },
  sem: { texto: "texto-sem-registro", bg: "bg-sem-registro" },
};

const pct = (presencas: number, aulas: number) => (aulas > 0 ? Math.round((presencas / aulas) * 100) : null);

/** Frequência do aluno para o responsável, com filtros por disciplina e período (H7). */
export function FrequenciaAlunos() {
  const { painel, erro, carregando } = usePainelResponsavel();
  const [disciplinaId, setDisciplinaId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const linhas = useMemo(() => {
    return (painel?.disciplinas ?? [])
      .filter((d) => !disciplinaId || String(d.id) === disciplinaId)
      .map((d) => {
        const chamadas = d.chamadas.filter((c) => (!inicio || c.data >= inicio) && (!fim || c.data <= fim));
        const presencas = chamadas.filter((c) => c.presente).length;
        return { ...d, chamadasFiltradas: chamadas, aulas: chamadas.length, presencas, percentual: pct(presencas, chamadas.length) };
      });
  }, [painel, disciplinaId, inicio, fim]);

  const totalAulas = linhas.reduce((a, l) => a + l.aulas, 0);
  const totalPresencas = linhas.reduce((a, l) => a + l.presencas, 0);
  const geral = pct(totalPresencas, totalAulas);
  const situacaoGeral = situacaoFrequencia(geral);
  const faltas = linhas.flatMap((l) => l.chamadasFiltradas.filter((c) => !c.presente).map((c) => ({ ...c, disciplina: l.nome })));

  return (
    <>
      <main className="conteudo-principal">
        <div className="cabecalho-frequencia">
          <h1 className="titulo-pagina">{painel?.aluno ? `Frequência de ${painel.aluno.nomeAluno}` : "Frequência"}</h1>
          {painel?.turma && <span className="subtitulo-turma">{painel.turma.nomeTurma} • {painel.segmento}</span>}
        </div>

        {carregando ? (
          <Carregando texto="Buscando a frequência..." />
        ) : erro ? (
          <p className="mensagem-lista-vazia" role="alert">{erro}</p>
        ) : !painel?.aluno ? (
          <ListaVazia texto="Nenhum aluno está vinculado à sua conta. Procure a secretaria da escola." />
        ) : !painel.turma ? (
          <ListaVazia texto={`${painel.aluno.nomeAluno} ainda não está matriculado(a) em uma turma.`} />
        ) : (
          <>
            <div className="container-filtros-notas">
              <div className="grupo-filtro">
                <label htmlFor="freq-disciplina">Disciplina:</label>
                <select id="freq-disciplina" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="select-filtro-custom">
                  <option value="">Todas as disciplinas</option>
                  {(painel.disciplinas ?? []).map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grupo-filtro">
                <label htmlFor="freq-inicio">De:</label>
                <input id="freq-inicio" type="date" value={inicio} max={fim || hojeISO()} onChange={(e) => setInicio(e.target.value)} className="select-filtro-custom" />
              </div>
              <div className="grupo-filtro">
                <label htmlFor="freq-fim">Até:</label>
                <input id="freq-fim" type="date" value={fim} min={inicio} max={hojeISO()} onChange={(e) => setFim(e.target.value)} className="select-filtro-custom" />
              </div>
              {(inicio || fim || disciplinaId) && (
                <div className="grupo-filtro" style={{ justifyContent: "flex-end" }}>
                  <button type="button" className="botao-secundario" onClick={() => { setDisciplinaId(""); setInicio(""); setFim(""); }}>
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>

            <div className="container-cards-frequencia">
              <div className="card-frequencia-geral">
                <div className="card-info-frequencia">
                  <span className="card-label">Frequência {disciplinaId || inicio || fim ? "no filtro" : "geral"}</span>
                  <h2 className="card-porcentagem-valor">{geral === null ? "Sem registros" : `${geral}%`}</h2>
                  <span className={`card-status-aviso ${CLASSES[situacaoGeral.classe].texto}`}>
                    {geral === null ? "Nenhuma chamada registrada no período." : `${situacaoGeral.texto} (${totalPresencas} presenças em ${totalAulas} aulas)`}
                  </span>
                </div>
                <div className="card-grafico-container" aria-hidden="true">
                  <svg viewBox="0 0 36 36" className="grafico-rosca-svg">
                    <path className="rosca-fundo-cinza" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className={`rosca-progresso-cor ${CLASSES[situacaoGeral.classe].texto}`} strokeDasharray={`${geral ?? 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                </div>
              </div>

              <div className="card-legenda-frequencia">
                <span className="legenda-titulo">Legenda</span>
                <div className="legenda-itens-container">
                  <div className="legenda-item"><span className="ponto-cor bg-excelente"></span><p><span className="bold-legenda">90% ou mais</span> — Excelente</p></div>
                  <div className="legenda-item"><span className="ponto-cor bg-atencao"></span><p><span className="bold-legenda">75% a 89%</span> — Atenção</p></div>
                  <div className="legenda-item"><span className="ponto-cor bg-critico"></span><p><span className="bold-legenda">Abaixo de 75%</span> — Crítico</p></div>
                </div>
              </div>
            </div>

            <div className="container-tabela-layout">
              <div className="tabela-wrapper-scroll">
                <table className="tabela-boletim-escolar">
                  <thead>
                    <tr>
                      <th scope="col" className="col-aluno">Disciplina</th>
                      <th scope="col" className="col-frequencia-barra">Frequência</th>
                      <th scope="col">Presenças / aulas</th>
                      <th scope="col" className="col-status-badge">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.map((l) => {
                      const s = situacaoFrequencia(l.percentual);
                      return (
                        <tr key={l.id}>
                          <th scope="row" className="nome-aluno-tabela">{l.nome}</th>
                          <td className="celula-progresso-frequencia">
                            <span className="porcentagem-texto-tabela">{l.percentual === null ? "—" : `${l.percentual}%`}</span>
                            <div className="barra-progresso-fundo" aria-hidden="true">
                              <div className={`barra-progresso-preenchimento ${CLASSES[s.classe].bg}`} style={{ width: `${l.percentual ?? 0}%` }}></div>
                            </div>
                          </td>
                          <td>{l.presencas} / {l.aulas}</td>
                          <td className="celula-status-tabela">
                            <span className={`badge-status-texto ${CLASSES[s.classe].texto}`}>{s.rotulo}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="subtitulo-faltas">Faltas no período</h2>
            {faltas.length === 0 ? (
              <ListaVazia texto="Nenhuma falta registrada no período escolhido." />
            ) : (
              <ul className="lista-faltas">
                {faltas.map((f) => (
                  <li key={`${f.disciplina}-${f.data}`}>{formatarData(f.data)} — {f.disciplina}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
      <SidebarResponsavel />
    </>
  );
}
