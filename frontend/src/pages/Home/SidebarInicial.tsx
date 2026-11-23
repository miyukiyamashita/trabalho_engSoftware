import { FiHome, FiUserPlus, FiLogIn } from "react-icons/fi";
import { SidebarBase } from "../../components/SidebarBase";

export function SidebarInicial() {
    return (
        <SidebarBase
            publico
            itens={[
                { para: "/", rotulo: "Início", icone: FiHome, exato: true },
                { para: "/telacadastro", rotulo: "Solicitar cadastro", icone: FiUserPlus },
                { para: "/login", rotulo: "Realizar login", icone: FiLogIn },
            ]}
        />
    );
}
