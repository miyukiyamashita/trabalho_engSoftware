import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SidebarProfessor } from "./SidebarProfessor";
import "./pageProf.css";
import { FiUsers, FiBookOpen, FiBell } from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../components/Feedback";
import { Carregando } from "../../components/Campos";
import { lerErro } from "../../utils/erros";

type Contagem = { alunos: number; turmas: number; disciplinas: number; avisos: number };

export function Dashboard() {
  const { user } = useAuth();
  const feedback = useFeedback();
  const [contagem, setContagem] = useState<Contagem | null>(null);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setContagem(r.data))
      .catch((e) => feedback.erro(lerErro(e, "Não foi possível carregar o painel.").mensagem));
  }, [feedback]);

  const cards = contagem
    ? [
        { rotulo: "Alunos", valor: contagem.alunos, para: "/prof/frequencia", cor: "bg-verde", Icone: FiUsers },
        { rotulo: "Turmas", valor: contagem.turmas, para: "/prof/notas", cor: "bg-amarelo", Icone: LuGraduationCap },
        { rotulo: "Disciplinas", valor: contagem.disciplinas, para: "/prof/notas", cor: "bg-verde", Icone: FiBookOpen },
        { rotulo: "Avisos", valor: contagem.avisos, para: "/prof/avisos", cor: "bg-vermelho", Icone: FiBell },
      ]
    : [];

  return (
    <>
      <main className="paginaProf">
        <div className="topo">
          <div className="texto">
            <h1>Dashboard</h1>
            {user && <p className="texto-ajuda">Olá, {user.nome}!</p>}
          </div>
        </div>

        {!contagem ? (
          <Carregando texto="Carregando o painel..." />
        ) : (
          <div className="dashboard-grid-prof">
            {cards.map(({ rotulo, valor, para, cor, Icone }) => (
              <Link to={para} className="card-metric" key={rotulo}>
                <div className={`icon-box ${cor}`}>
                  <Icone aria-hidden="true" />
                </div>
                <div className="card-info">
                  <span>{rotulo}</span>
                  <strong>{valor}</strong>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SidebarProfessor />
    </>
  );
}
