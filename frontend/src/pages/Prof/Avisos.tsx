import { SidebarProfessor } from "./SidebarProfessor";
import { TelaAvisos } from "../../components/TelaAvisos";

/** RF10 (professor): avisos apenas para as turmas em que leciona; o envio passa pela API. */
export function Avisos() {
    return <TelaAvisos Sidebar={SidebarProfessor} rotuloPublico="Público (suas turmas):" />;
}
