import { FiHome, FiClipboard, FiMapPin } from "react-icons/fi";
import { SidebarBase } from "../../components/SidebarBase";

export function SidebarAdminSistema() {
    return (
        <SidebarBase
            itens={[
                { para: "/admin-sistema", rotulo: "Início", icone: FiHome, exato: true },
                { para: "/admin-sistema/solicitacoes", rotulo: "Solicitações", icone: FiClipboard },
                { para: "/admin-sistema/escolas", rotulo: "Escolas", icone: FiMapPin },
            ]}
        />
    );
}
