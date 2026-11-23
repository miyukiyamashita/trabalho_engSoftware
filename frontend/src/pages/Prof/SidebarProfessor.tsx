import { FiGrid, FiBookOpen, FiBarChart2, FiBell } from "react-icons/fi";
import { SidebarBase } from "../../components/SidebarBase";

export function SidebarProfessor() {
    return (
        <SidebarBase
            itens={[
                { para: "/prof/dashboard", rotulo: "Dashboard", icone: FiGrid },
                { para: "/prof/notas", rotulo: "Notas", icone: FiBookOpen },
                { para: "/prof/frequencia", rotulo: "Frequência", icone: FiBarChart2 },
                { para: "/prof/avisos", rotulo: "Avisos", icone: FiBell },
            ]}
        />
    );
}
