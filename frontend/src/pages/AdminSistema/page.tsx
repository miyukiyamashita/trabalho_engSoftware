import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SidebarAdminSistema } from "./SidebarAdminSistema";
import "./pageAdmin.css";
import { api } from "../../services/api";
import { Carregando } from "../../components/Campos";
import { useFeedback } from "../../components/Feedback";
import { lerErro } from "../../utils/erros";

import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { FiUsers, FiBell } from "react-icons/fi";

export default function AdminSistema() {
  const feedback = useFeedback();
  const [contagem, setContagem] = useState<{ escolas: number; usuarios: number; solicitacoesPendentes: number } | null>(
    null
  );

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setContagem(r.data))
      .catch((e) => feedback.erro(lerErro(e, "Não foi possível carregar o painel.").mensagem));
  }, [feedback]);

  return (
    <>
      <main className="paginaAdminSistema">
        <div className="topo">
          <div className="texto">
            <h1>Dashboard</h1>
          </div>
        </div>

        {!contagem ? (
          <Carregando texto="Carregando o painel..." />
        ) : (
          <div className="dashboard-grid">
            <Link to="/admin-sistema/escolas" className="card-metric">
              <div className="icon-box bg-roxo">
                <LiaChalkboardTeacherSolid aria-hidden="true" />
              </div>
              <div className="card-info">
                <span>Escolas</span>
                <strong>{contagem.escolas}</strong>
              </div>
            </Link>

            <div className="card-metric">
              <div className="icon-box bg-verde">
                <FiUsers aria-hidden="true" />
              </div>
              <div className="card-info">
                <span>Usuários</span>
                <strong>{contagem.usuarios}</strong>
              </div>
            </div>

            <Link to="/admin-sistema/solicitacoes" className="card-metric">
              <div className="icon-box bg-vermelho">
                <FiBell aria-hidden="true" />
              </div>
              <div className="card-info">
                <span>Solicitações pendentes</span>
                <strong>{contagem.solicitacoesPendentes}</strong>
              </div>
            </Link>
          </div>
        )}
      </main>

      <SidebarAdminSistema />
    </>
  );
}
