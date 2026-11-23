import { FiHome, FiBookOpen, FiBarChart2, FiBell, FiFileText } from "react-icons/fi";
import { SidebarBase } from "../../components/SidebarBase";

export function SidebarResponsavel() {
    return (
        <SidebarBase
            itens={[
                { para: "/responsavel", rotulo: "Início", icone: FiHome, exato: true },
                { para: "/responsavel/notas", rotulo: "Notas", icone: FiBookOpen },
                { para: "/responsavel/frequencia", rotulo: "Frequência", icone: FiBarChart2 },
                { para: "/responsavel/avisos", rotulo: "Avisos", icone: FiBell },
                { para: "/responsavel/relatoriofinal", rotulo: "Relatório Final", icone: FiFileText },
            ]}
        />
    );
}
