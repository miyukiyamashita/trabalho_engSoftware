import { SidebarProfessor } from "./SidebarProfessor";
import "./Notas.css";
import { useEffect, useMemo, useState } from "react";
import { FiCheckSquare, FiSquare } from "react-icons/fi";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, Carregando, ListaVazia, propsErro } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import { formatarData, hojeISO } from "../../utils/formatar";

/** RF12: o professor registra a frequência das turmas em que leciona. */
export function Frequencia() {
  const feedback = useFeedback();
  const { confirmar } = useConfirm();
  const [turmas, setTurmas] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [data, setData] = useState(hojeISO());
  const [alunos, setAlunos] = useState<any[] | null>(null);
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [registroExistente, setRegistroExistente] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([api.get("/turmas"), api.get("/disciplinas")])
      .then(([t, d]) => {
        setTurmas(t.data);
        setDisciplinas(d.data);
      })
      .catch((e) => feedback.erro(lerErro(e, "Não foi possível carregar suas turmas.").mensagem));
  }, [feedback]);

  const disciplinasDaTurma = useMemo(() => {
    const turma = turmas.find((t) => String(t.id) === turmaId);
    const ids = (turma?.disciplinas ?? []).map(String);
    return disciplinas.filter((d) => ids.includes(String(d.id)));
  }, [turmas, disciplinas, turmaId]);

  useEffect(() => {
    setDisciplinaId(disciplinasDaTurma.length === 1 ? String(disciplinasDaTurma[0].id) : "");
  }, [disciplinasDaTurma]);

  async function carregarChamada() {
    setAlunos(null);
    try {
      const [a, f] = await Promise.all([
        api.get("/alunos", { params: { turmaId } }),
        api.get("/frequencia/buscar", { params: { turmaId, disciplinaId, data } }),
      ]);
      const registro = f.data || null;
      const estrutura: Record<string, boolean> = {};
      a.data.forEach((aluno: any) => {
        const r = registro?.chamada?.find((c: any) => String(c.alunoId) === String(aluno.id));
        estrutura[aluno.id] = r ? Boolean(r.presente) : true;
      });
      setRegistroExistente(registro);
      setPresencas(estrutura);
      setAlunos(a.data);
    } catch (e) {
      setAlunos([]);
      feedback.erro(lerErro(e, "Não foi possível carregar a chamada.").mensagem);
    }
  }

  useEffect(() => {
    if (turmaId && disciplinaId && data) carregarChamada();
    else setAlunos(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaId, disciplinaId, data]);

  const totalPresentes = Object.values(presencas).filter(Boolean).length;

  function marcarTodos(valor: boolean) {
    setPresencas(Object.fromEntries((alunos ?? []).map((a) => [a.id, valor])));
  }

  async function salvarFrequencia(e: React.FormEvent) {
    e.preventDefault();
    // H5/H9: data futura é barrada antes do envio, com o motivo junto ao campo.
    if (data > hojeISO()) {
      setErros({ data: "A data da aula não pode ser futura. Escolha hoje ou uma data anterior." });
      feedback.erro("Não é possível registrar frequência em data futura.");
      return;
    }
    const nomeDisciplina = disciplinasDaTurma.find((d) => String(d.id) === disciplinaId)?.nomeDisciplina ?? "";
    const ausentes = (alunos ?? []).filter((a) => !presencas[a.id]).map((a) => a.nomeAluno);
    if (registroExistente) {
      const ok = await confirmar({
        titulo: "Substituir a chamada já registrada?",
        mensagem: `Já existe chamada de ${nomeDisciplina} em ${formatarData(data)}. Ela será substituída por esta:`,
        detalhes: [
          ["Presentes", `${totalPresentes} de ${alunos?.length ?? 0}`],
          ["Ausentes", ausentes.join(", ") || "nenhum"],
        ],
        textoConfirmar: "Substituir chamada",
      });
      if (!ok) return;
    }

    setSalvando(true);
    try {
      await api.post("/frequencia/registrar", {
        turmaId,
        disciplinaId,
        data,
        chamada: (alunos ?? []).map((a) => ({ alunoId: String(a.id), presente: Boolean(presencas[a.id]) })),
      });
      feedback.sucesso(
        `Frequência de ${formatarData(data)} salva: ${totalPresentes} presente(s) e ${ausentes.length} ausente(s).`
      );
      await carregarChamada();
    } catch (erro) {
      const lido = lerErro(erro, "Não foi possível salvar a chamada.");
      setErros(lido.campos);
      feedback.erro(lido.campos.data ? "Não é possível registrar frequência em data futura." : lido.mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <main className="conteudo-principal">
        <div className="cabecalho-abas">
          <h1 className="titulo-pagina">Registro de frequência</h1>
        </div>
        <p className="texto-ajuda">
          Escolha a turma, a disciplina e a data da aula. Todos começam marcados como presentes: desmarque quem faltou e
          salve.
        </p>

        <div className="container-filtros-notas">
          <div className="grupo-filtro">
            <label htmlFor="select-turma">Turma:</label>
            <select id="select-turma" value={turmaId} onChange={(e) => setTurmaId(e.target.value)} className="select-filtro-custom">
              <option value="">-- Escolha uma turma --</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>{t.nomeTurma} - {t.turno}</option>
              ))}
            </select>
          </div>
          <div className="grupo-filtro">
            <label htmlFor="select-disciplina">Disciplina:</label>
            <select id="select-disciplina" value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)} className="select-filtro-custom" disabled={!turmaId}>
              <option value="">-- Escolha uma disciplina --</option>
              {disciplinasDaTurma.map((d) => (
                <option key={d.id} value={d.id}>{d.nomeDisciplina}</option>
              ))}
            </select>
          </div>
          <div className="grupo-filtro">
            <label htmlFor="input-data">Data da aula:</label>
            <input
              type="date"
              id="input-data"
              value={data}
              max={hojeISO()}
              onChange={(e) => {
                setData(e.target.value);
                setErros({});
              }}
              {...propsErro("data", erros)}
              aria-describedby={erros.data ? "erro-data" : "dica-data"}
              className={`select-filtro-custom input-data-custom ${erros.data ? "campo-invalido" : ""}`}
            />
            {erros.data ? (
              <CampoErro id="erro-data" mensagem={erros.data} />
            ) : (
              <span className="dica-campo" id="dica-data">Datas futuras ficam bloqueadas.</span>
            )}
          </div>
        </div>

        {!turmaId || !disciplinaId || !data ? (
          <ListaVazia texto="Escolha a turma, a disciplina e a data para fazer a chamada." />
        ) : alunos === null ? (
          <Carregando texto="Carregando a chamada..." />
        ) : alunos.length === 0 ? (
          <ListaVazia texto="Nenhum aluno cadastrado nesta turma." />
        ) : (
          <form onSubmit={salvarFrequencia} className="container-tabela-layout" noValidate>
            <div className="barra-filtros">
              <button type="button" className="botao-secundario" onClick={() => marcarTodos(true)}>
                <FiCheckSquare aria-hidden="true" /> Marcar todos presentes
              </button>
              <button type="button" className="botao-secundario" onClick={() => marcarTodos(false)}>
                <FiSquare aria-hidden="true" /> Desmarcar todos
              </button>
              <span className="texto-ajuda" role="status">
                {totalPresentes} de {alunos.length} presentes
                {registroExistente ? " · já existe chamada salva nesta data" : " · chamada ainda não salva"}
              </span>
            </div>
            <div className="tabela-wrapper-scroll">
              <table className="tabela-boletim-escolar">
                <thead>
                  <tr>
                    <th scope="col" className="col-aluno th-col-aluno-frequencia">Aluno</th>
                    <th scope="col" className="th-col-matricula-frequencia">CPF</th>
                    <th scope="col" className="th-col-presenca-frequencia">Presente?</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => {
                    const presente = Boolean(presencas[aluno.id]);
                    return (
                      <tr key={aluno.id}>
                        <th scope="row">
                          <label htmlFor={`presenca-${aluno.id}`} className="nome-aluno-tabela nome-aluno-frequencia">
                            {aluno.nomeAluno}
                          </label>
                        </th>
                        <td className="celula-matricula-frequencia">{aluno.cpfAluno}</td>
                        <td className="celula-checkbox-frequencia">
                          <input
                            id={`presenca-${aluno.id}`}
                            type="checkbox"
                            checked={presente}
                            onChange={() => setPresencas((p) => ({ ...p, [aluno.id]: !p[aluno.id] }))}
                            className={`checkbox-frequencia-base ${!presente ? "checkbox-cinza-desmarcado" : ""}`}
                          />
                          <span className="texto-presenca">{presente ? "Presente" : "Ausente"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="secao-botao-salvar">
              <button type="submit" className="btn-salvar-boletim" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar frequência"}
              </button>
            </div>
          </form>
        )}
      </main>
      <SidebarProfessor />
    </>
  );
}
