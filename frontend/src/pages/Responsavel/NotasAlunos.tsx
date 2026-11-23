import { SidebarResponsavel } from "./SidebarResponsavel";
import { useState } from "react";
import "./Notas.css";
import "../Prof/Notas.css";
import { usePainelResponsavel } from "./usePainel";
import { Carregando, ListaVazia } from "../../components/Campos";
import { BIMESTRES, NOME_BIMESTRE, NOTA_MAX_BIMESTRE, NOTA_MAX_FINAL, formatarNota, type Bimestre } from "../../utils/notas";

/** Boletim do aluno para o responsável, com filtros por disciplina e bimestre (H7). */
export function NotasAlunos() {
  const { painel, erro, carregando } = usePainelResponsavel();
  const [disciplinaId, setDisciplinaId] = useState("");
  const [bimestre, setBimestre] = useState<Bimestre | "">("");

  const disciplinas = painel?.disciplinas ?? [];
  const visiveis = disciplinas.filter((d) => !disciplinaId || String(d.id) === disciplinaId);
  const colunas = bimestre ? [bimestre] : [...BIMESTRES];

  return (
    <>
      <main className="conteudo-principal">
        <div className="cabecalho-abas">
          <h1 className="titulo-pagina">{painel?.aluno ? `Notas de ${painel.aluno.nomeAluno}` : "Notas"}</h1>
        </div>

        {carregando ? (
          <Carregando texto="Buscando o boletim..." />
        ) : erro ? (
          <p className="mensagem-lista-vazia" role="alert">{erro}</p>
        ) : !painel?.aluno ? (
          <ListaVazia texto="Nenhum aluno está vinculado à sua conta. Procure a secretaria da escola." />
        ) : !painel.turma ? (
          <ListaVazia texto={`${painel.aluno.nomeAluno} ainda não está matriculado(a) em uma turma.`} />
        ) : (
          <>
            <p className="texto-ajuda">
              {painel.turma.nomeTurma} • {painel.segmento}. Cada bimestre vale de 0 a {NOTA_MAX_BIMESTRE} pontos e a nota
              final é a <strong>soma</strong> dos 4 bimestres (0 a {NOTA_MAX_FINAL}). "Parcial" indica que ainda faltam
              bimestres.
            </p>

            <div className="container-filtros-notas">
              <div className="grupo-filtro">
                <label htmlFor="filtro-disciplina">Disciplina:</label>
                <select id="filtro-disciplina" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="select-filtro-custom">
                  <option value="">Todas as disciplinas</option>
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>{d.nome}</option>
                  ))}
                </select>
              </div>
              <div className="grupo-filtro">
                <label htmlFor="filtro-bimestre">Bimestre:</label>
                <select id="filtro-bimestre" value={bimestre} onChange={(e) => setBimestre(e.target.value as Bimestre | "")} className="select-filtro-custom">
                  <option value="">Todos os bimestres</option>
                  {BIMESTRES.map((b) => (
                    <option key={b} value={b}>{NOME_BIMESTRE[b]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="container-tabela-layout">
              <div className="tabela-wrapper-scroll">
                <table className="tabela-boletim-escolar">
                  <thead>
                    <tr>
                      <th scope="col" className="col-aluno">Disciplina</th>
                      {colunas.map((b) => (
                        <th scope="col" key={b} className="col-bim">{NOME_BIMESTRE[b]}</th>
                      ))}
                      <th scope="col" className="col-media">Nota final (0–{NOTA_MAX_FINAL})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.length === 0 && (
                      <tr><td colSpan={colunas.length + 2}><ListaVazia texto="Nenhuma disciplina na turma." /></td></tr>
                    )}
                    {visiveis.map((d) => (
                      <tr key={d.id}>
                        <th scope="row" className="nome-aluno-tabela">
                          {d.nome}
                          {d.professor && <div className="cpf-aluno-tabela">Professor(a): {d.professor}</div>}
                        </th>
                        {colunas.map((b) => (
                          <td key={b} className="celula-media-resultado">{formatarNota(d.notas[b])}</td>
                        ))}
                        <td className="celula-media-resultado celula-media-final-negrito">
                          {d.notaFinal === null ? "Sem notas" : formatarNota(d.notaFinal)}
                          {d.notaParcial && <span className="nota-parcial"> (parcial)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="legenda-rodape-notas-aluno">
              * Nota final: soma das notas dos bimestres (cada bimestre de 0 a {NOTA_MAX_BIMESTRE}). "—" = nota ainda não
              lançada.
            </p>
          </>
        )}
      </main>
      <SidebarResponsavel />
    </>
  );
}
