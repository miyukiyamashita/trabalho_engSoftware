import { SidebarAdminEscolar } from "./SidebarAdminEscolar";
import "./pageEscolar.css";
import { TelaAvisos } from "../../components/TelaAvisos";

/** RF10 (administrador escolar): avisos para qualquer turma da escola. */
export function AvisosAdminEscolar() {
    return <TelaAvisos Sidebar={SidebarAdminEscolar} rotuloPublico="Público (turmas):" />;
}
