import "./TelaCadastro.css";
import { SidebarInicial } from "./SidebarInicial";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { validarTelefone, validarCPF, validarCNPJ, validarEmail, obrigatorios, MSG } from "../../utils/validadores";
import { lerErro } from "../../utils/erros";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, propsErro } from "../../components/Campos";

const formInicial = {
  nomeInstituicao: "",
  cnpj: "",
  endereco: "",
  telefone: "",
  emailInstituicao: "",
  setorEducacional: "",
  nomeRepresentante: "",
  cpfRepresentante: "",
  emailRepresentante: "",
  cargo: "",
  numeroAlunos: "",
};

const ROTULOS: Record<keyof typeof formInicial, string> = {
  nomeInstituicao: "Nome da instituição",
  cnpj: "CNPJ",
  endereco: "Endereço",
  telefone: "Telefone",
  emailInstituicao: "E-mail da instituição",
  setorEducacional: "Setor educacional",
  nomeRepresentante: "Nome do representante",
  cpfRepresentante: "CPF do representante",
  emailRepresentante: "E-mail do representante",
  cargo: "Cargo",
  numeroAlunos: "Número de alunos",
};

/** RF01: o administrador escolar solicita o cadastro da instituição. */
export default function SolicitacaoCadastro() {
  const navigate = useNavigate();
  const feedback = useFeedback();
  const { avisar } = useConfirm();
  const [form, setForm] = useState(formInicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErros((prev) => {
      const { [name]: _removido, ...resto } = prev;
      return resto;
    });
  }

  function validar() {
    const e = obrigatorios(form, ROTULOS);
    if (form.cnpj && !validarCNPJ(form.cnpj)) e.cnpj = MSG.cnpj;
    if (form.cpfRepresentante && !validarCPF(form.cpfRepresentante)) e.cpfRepresentante = MSG.cpf;
    if (form.telefone && !validarTelefone(form.telefone)) e.telefone = MSG.telefone;
    if (form.emailInstituicao && !validarEmail(form.emailInstituicao)) e.emailInstituicao = MSG.email;
    if (form.emailRepresentante && !validarEmail(form.emailRepresentante)) e.emailRepresentante = MSG.email;
    return e;
  }

  async function enviarSolicitacao(e: React.FormEvent) {
    e.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    setCarregando(true);
    try {
      const { data } = await api.post("/solicitacoes-cadastro", form);
      setForm(formInicial);
      await avisar({
        titulo: "Solicitação enviada!",
        mensagem:
          "A equipe do CRESCE vai analisar os dados. O resultado será enviado para o e-mail do representante.",
        detalhes: [
          ["Protocolo", String(data.id)],
          ["Situação", "Pendente (em análise)"],
        ],
      });
    } catch (error) {
      const { mensagem, campos } = lerErro(error, "Não foi possível enviar a solicitação. Tente novamente.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  const campo = (nome: keyof typeof formInicial, tipo = "text", placeholder = "") => (
    <div className="campo">
      <label htmlFor={`cad-${nome}`}>{ROTULOS[nome]}:</label>
      <input
        id={`cad-${nome}`}
        type={tipo}
        name={nome}
        value={form[nome]}
        onChange={handleChange}
        placeholder={placeholder}
        {...propsErro(nome, erros)}
      />
      <CampoErro id={`erro-${nome}`} mensagem={erros[nome]} />
    </div>
  );

  return (
    <>
      <SidebarInicial />

      <div className="container-cadastro">
        <form className="formulario" onSubmit={enviarSolicitacao} noValidate>
          <h1 className="titulo-pagina">Solicitar cadastro da escola</h1>
          <p className="texto-ajuda">
            Preencha os dados da instituição e do representante. Todos os campos são obrigatórios. Depois de
            enviada, a solicitação é analisada pelo administrador do sistema.
          </p>

          <div className="linha-formulario">
            {campo("nomeInstituicao", "text", "Ex.: Escola Municipal Crescer")}
            {campo("cnpj", "text", "00.000.000/0000-00")}
            {campo("endereco", "text", "Rua, número e bairro")}
          </div>

          <div className="linha-formulario">
            {campo("telefone", "tel", "(00) 00000-0000")}
            {campo("emailInstituicao", "email", "contato@escola.com")}
            <div className="campo">
              <label htmlFor="cad-setorEducacional">Setor educacional:</label>
              <select
                id="cad-setorEducacional"
                name="setorEducacional"
                value={form.setorEducacional}
                onChange={handleChange}
                {...propsErro("setorEducacional", erros)}
              >
                <option value="">Selecione...</option>
                <option value="infantil">Educação Infantil</option>
                <option value="fundamental">Ensino Fundamental I</option>
              </select>
              <CampoErro id="erro-setorEducacional" mensagem={erros.setorEducacional} />
            </div>
          </div>

          <div className="linha-formulario">
            {campo("nomeRepresentante", "text", "Nome completo")}
            {campo("cpfRepresentante", "text", "000.000.000-00")}
            <div className="campo">
              <label htmlFor="cad-numeroAlunos">Número de alunos:</label>
              <select
                id="cad-numeroAlunos"
                name="numeroAlunos"
                value={form.numeroAlunos}
                onChange={handleChange}
                {...propsErro("numeroAlunos", erros)}
              >
                <option value="">Selecione...</option>
                <option value="0-100">Até 100 alunos</option>
                <option value="101-500">101 a 500 alunos</option>
                <option value="501-1000">501 a 1000 alunos</option>
                <option value="1000+">Mais de 1000 alunos</option>
              </select>
              <CampoErro id="erro-numeroAlunos" mensagem={erros.numeroAlunos} />
            </div>
          </div>

          <div className="linha-formulario">
            {campo("emailRepresentante", "email", "seu.email@escola.com")}
            {campo("cargo", "text", "Ex.: Diretora")}
          </div>

          <div className="acoes-formulario">
            <button type="button" className="botao-secundario" onClick={() => navigate("/")}>
              Cancelar
            </button>
            <button type="submit" className="botao-primario" disabled={carregando}>
              {carregando ? "Enviando..." : "Solicitar cadastro"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
