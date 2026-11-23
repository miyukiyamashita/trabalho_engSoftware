import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiEdit2, FiTrash2, FiUserMinus } from "react-icons/fi";
import "./TurmaDetalhes.css";
import "./turma.css";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { Carregando, ListaVazia } from "../../components/Campos";
import { lerErro } from "../../utils/erros";

/** Detalhes da turma (RF07): alunos e disciplinas vinculados, com retirada confirmada. */
export function TurmaDetalhes() {
  const navigate = useNavigate();
  const { id } = useParams();
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [turma, setTurma] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async () => {
    try {
      const [t, a, d, p] = await Promise.all([
        api.get(`/turmas/${id}`),
        api.get("/alunos"),
        api.get("/disciplinas"),
        api.get("/professores"),
      ]);
      setTurma(t.data);
      setAlunos(a.data);
      setDisciplinas(d.data);
      setProfessores(p.data);
    } catch (e) {
      setErro(lerErro(e, "Não foi possível carregar a turma.").mensagem);
    }
  }, [id]);

  useEffect(() => {
    if (id) carregarDados();
  }, [id, carregarDados]);

  const voltar = () => navigate("/admin-escolar/turmas", { state: { aba: "visualizacao" } });

  async function excluirTurma() {
    const ok = await confirmar({
      titulo: `Excluir a turma ${turma.nomeTurma}?`,
      mensagem: "As notas e chamadas lançadas nesta turma também serão apagadas. Os alunos continuam cadastrados. Esta ação não pode ser desfeita.",
      textoConfirmar: "Excluir turma",
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/turmas/${id}`);
      feedback.sucesso(`Turma ${turma.nomeTurma} excluída com sucesso.`);
      voltar();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível excluir a turma.").mensagem);
    }
  }

  async function retirar(tipo: "aluno" | "disciplina", itemId: string, nome: string) {
    const ok = await confirmar({
      titulo: tipo === "aluno" ? `Retirar ${nome} da turma?` : `Retirar a disciplina ${nome} da turma?`,
      mensagem:
        tipo === "aluno"
          ? "O aluno continua cadastrado na escola e pode ser incluído em outra turma."
          : "A disciplina continua cadastrada e pode ser incluída de novo depois.",
      textoConfirmar: "Retirar",
      perigo: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/turmas/${id}/remover-${tipo}`, tipo === "aluno" ? { alunoId: itemId } : { disciplinaId: itemId });
      feedback.sucesso(tipo === "aluno" ? `${nome} foi retirado(a) da turma.` : `Disciplina ${nome} retirada da turma.`);
      carregarDados();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível concluir a retirada.").mensagem);
    }
  }

  if (erro) {
    return (
      <>
        <main className="conteudo-principal-turmas">
          <p className="lista-vazia" role="alert">{erro}</p>
          <button type="button" className="botao-secundario" onClick={voltar}>
            <FiArrowLeft aria-hidden="true" /> Voltar para turmas
          </button>
        </main>
        <SidebarAdminEscolar />
      </>
    );
  }

  if (!turma) {
    return (
      <>
        <main className="conteudo-principal-turmas">
          <Carregando texto="Carregando turma..." />
        </main>
        <SidebarAdminEscolar />
      </>
    );
  }

  // Registros ausentes não quebram mais a tela (T12): aparecem como "não encontrado".
  const alunosDaTurma = (turma.alunos ?? []).map((alunoId: string) => ({
    id: alunoId,
    aluno: alunos.find((a) => String(a.id) === String(alunoId)),
  }));
  const disciplinasDaTurma = (turma.disciplinas ?? []).map((discId: string) => {
    const disciplina = disciplinas.find((d) => String(d.id) === String(discId));
    const professor = disciplina ? professores.find((p) => String(p.id) === String(disciplina.professorId)) : null;
    return { id: discId, disciplina, professor };
  });

  return (
    <>
      <div className="topo-ver-turma">
        <button type="button" className="voltar" onClick={voltar}>
          <FiArrowLeft aria-hidden="true" /> Voltar
        </button>
      </div>
      <main className="conteudo-principal-turmas">
        <h1 className="titulo-pagina">Turma {turma.nomeTurma}</h1>
        <div className="container-tabela-turmas">
          <div className="tabela-wrapper">
            <table className="tabela-turmas">
              <thead>
                <tr>
                  <th scope="col">Turma</th>
                  <th scope="col">Ano/Série</th>
                  <th scope="col">Turno</th>
                  <th scope="col">Alunos / capacidade</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{turma.nomeTurma}</td>
                  <td>{turma.anoSerie}º ano</td>
                  <td>{turma.turno}</td>
                  <td>{(turma.alunos ?? []).length} / {turma.capacidade}</td>
                  <td>
                    <div className="acoes-tabela">
                      <button type="button" className="botao-editar" onClick={() => navigate("/admin-escolar/turmas", { state: { editarId: turma.id } })}>
                        <FiEdit2 aria-hidden="true" /> Editar
                      </button>
                      <button type="button" className="botao-perigo" onClick={excluirTurma}>
                        <FiTrash2 aria-hidden="true" /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <div className="tabela-ver-turma">
        <div className="container-tabela-alunos">
          <div className="tabela-wrapper">
            <table className="tabela-alunos">
              <caption className="visualmente-oculto">Alunos da turma</caption>
              <thead>
                <tr>
                  <th scope="col">Aluno - CPF</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosDaTurma.length === 0 && (
                  <tr><td colSpan={2}><ListaVazia texto="Nenhum aluno nesta turma. Use Editar para incluir." /></td></tr>
                )}
                {alunosDaTurma.map(({ id: alunoId, aluno }: any) => (
                  <tr key={alunoId}>
                    <td>{aluno ? `${aluno.nomeAluno} - ${aluno.cpfAluno}` : "Aluno não encontrado (excluído)"}</td>
                    <td>
                      <button type="button" className="botao-perigo" onClick={() => retirar("aluno", alunoId, aluno?.nomeAluno ?? "este aluno")}>
                        <FiUserMinus aria-hidden="true" /> Retirar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="container-tabela-disciplinas">
          <div className="tabela-wrapper">
            <table className="tabela-disciplinas">
              <caption className="visualmente-oculto">Disciplinas da turma</caption>
              <thead>
                <tr>
                  <th scope="col">Disciplina</th>
                  <th scope="col">Professor - CPF</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {disciplinasDaTurma.length === 0 && (
                  <tr><td colSpan={3}><ListaVazia texto="Nenhuma disciplina nesta turma. Use Editar para incluir." /></td></tr>
                )}
                {disciplinasDaTurma.map(({ id: discId, disciplina, professor }: any) => (
                  <tr key={discId}>
                    <td>{disciplina ? `${disciplina.nomeDisciplina} - ${disciplina.codigo}` : "Disciplina não encontrada (excluída)"}</td>
                    <td>{professor ? `${professor.nome} - ${professor.cpf}` : "Professor não encontrado"}</td>
                    <td>
                      <button type="button" className="botao-perigo" onClick={() => retirar("disciplina", discId, disciplina?.nomeDisciplina ?? "esta disciplina")}>
                        <FiTrash2 aria-hidden="true" /> Retirar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <SidebarAdminEscolar />
    </>
  );
}
