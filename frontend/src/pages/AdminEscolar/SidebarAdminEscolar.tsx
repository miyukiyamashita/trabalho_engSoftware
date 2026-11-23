import { FiGrid, FiUsers, FiUser, FiLayers, FiBook, FiBell, FiFileText, FiHome } from "react-icons/fi";
import { SidebarBase } from "../../components/SidebarBase";

export function SidebarAdminEscolar() {
    return (
        <SidebarBase
            itens={[
                { para: "/admin-escolar/dashboard", rotulo: "Dashboard", icone: FiGrid },
                { para: "/admin-escolar/professores", rotulo: "Professores", icone: FiUsers },
                { para: "/admin-escolar/alunos", rotulo: "Alunos", icone: FiUser },
                { para: "/admin-escolar/turmas", rotulo: "Turmas", icone: FiLayers },
                { para: "/admin-escolar/disciplinas", rotulo: "Disciplinas", icone: FiBook },
                { para: "/admin-escolar/avisos", rotulo: "Avisos", icone: FiBell },
                { para: "/admin-escolar/relatoriofinal", rotulo: "Relatório Final", icone: FiFileText },
                { para: "/admin-escolar/escola", rotulo: "Escola", icone: FiHome },
            ]}
        />
    );
}
