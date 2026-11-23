import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./dashboard.css";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { FiUsers, FiBookOpen, FiBell } from "react-icons/fi";
import { LuGraduationCap } from "react-icons/lu";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../components/Feedback";
import { Carregando } from "../../components/Campos";
import { lerErro } from "../../utils/erros";

type Contagem = { professores: number; alunos: number; turmas: number; disciplinas: number; avisos: number };

export function AdminEscolar() {
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
        { rotulo: "Professores", valor: contagem.professores, para: "/admin-escolar/professores", cor: "bg-roxo", Icone: LiaChalkboardTeacherSolid },
        { rotulo: "Alunos", valor: contagem.alunos, para: "/admin-escolar/alunos", cor: "bg-verde", Icone: FiUsers },
        { rotulo: "Turmas", valor: contagem.turmas, para: "/admin-escolar/turmas", cor: "bg-amarelo", Icone: LuGraduationCap },
        { rotulo: "Disciplinas", valor: contagem.disciplinas, para: "/admin-escolar/disciplinas", cor: "bg-verde", Icone: FiBookOpen },
        { rotulo: "Avisos", valor: contagem.avisos, para: "/admin-escolar/avisos", cor: "bg-vermelho", Icone: FiBell },
      ]
    : [];

  return (
    <>
      <main className="pagAdmEsc">
        <div className="topo">
          <div className="texto">
            <h1>Dashboard</h1>
            {user?.escola && <p className="texto-ajuda">{user.escola.nome}</p>}
          </div>
        </div>

        {!contagem ? (
          <Carregando texto="Carregando o painel da escola..." />
        ) : (
          <div className="dashboard-grid-escolar">
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

      <SidebarAdminEscolar />
    </>
  );
}
