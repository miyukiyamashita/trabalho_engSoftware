import { SidebarAdminSistema } from "./SidebarAdminSistema";
import "./Escola.css";
import "./pageAdmin.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import { api } from "../../services/api";
import { useFeedback } from "../../components/Feedback";
import { useConfirm } from "../../components/ConfirmDialog";
import { CampoErro, Carregando, ListaVazia, propsErro } from "../../components/Campos";
import { lerErro } from "../../utils/erros";
import { CAMPOS_ESCOLA, PORTE_ESCOLA, SETOR_EDUCACIONAL } from "../../utils/formatar";
import { MSG, obrigatorios, validarCNPJ, validarCPF, validarEmail, validarTelefone } from "../../utils/validadores";

const formInicial = {
  nome: "",
  cnpj: "",
  endereco: "",
  telefone: "",
  email: "",
  setorEducacional: "",
  numeroAlunos: "",
  nomeRepresentante: "",
  cpfRepresentante: "",
  emailRepresentante: "",
  cargoRepresentante: "",
};
type Form = typeof formInicial;

const ROTULOS_ESCOLA = {
  nome: "Nome da escola",
  cnpj: "CNPJ",
  endereco: "Endereço",
  telefone: "Telefone",
  setorEducacional: "Setor educacional",
  numeroAlunos: "Número de alunos",
};
const ROTULOS_ADMIN = {
  nomeRepresentante: "Nome do administrador escolar",
  emailRepresentante: "E-mail do administrador escolar",
  cargoRepresentante: "Cargo",
};

/** RF04: o administrador do sistema cadastra, edita e remove escolas diretamente. */
export function Escolas() {
  const feedback = useFeedback();
  const { confirmar, avisar } = useConfirm();
  const [escolas, setEscolas] = useState<any[] | null>(null);
  const [busca, setBusca] = useState("");
  const [modo, setModo] = useState<"lista" | "nova" | "editar">("lista");
  const [editando, setEditando] = useState<any>(null);
  const [form, setForm] = useState<Form>(formInicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const carregarEscolas = useCallback(async () => {
    try {
      const response = await api.get("/escolas");
      setEscolas(response.data);
    } catch (e) {
      setEscolas([]);
      feedback.erro(lerErro(e, "Não foi possível carregar as escolas.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    carregarEscolas();
  }, [carregarEscolas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (escolas ?? []).filter(
      (e) => !termo || `${e.nome} ${e.cnpj} ${e.endereco}`.toLowerCase().includes(termo)
    );
  }, [escolas, busca]);

  function abrirNova() {
    setForm(formInicial);
    setErros({});
    setEditando(null);
    setModo("nova");
  }

  function abrirEdicao(escola: any) {
    setForm({ ...formInicial, ...Object.fromEntries(Object.keys(CAMPOS_ESCOLA).map((c) => [c, escola[c] ?? ""])) });
    setErros({});
    setEditando(escola);
    setModo("editar");
  }

  function voltar() {
    setModo("lista");
    setEditando(null);
    setErros({});
  }

  function alterar(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErros((prev) => {
      const { [name]: _x, ...resto } = prev;
      return resto;
    });
  }

  function validar() {
    const e = obrigatorios(form, modo === "nova" ? { ...ROTULOS_ESCOLA, ...ROTULOS_ADMIN } : ROTULOS_ESCOLA);
    if (form.cnpj && !validarCNPJ(form.cnpj)) e.cnpj = MSG.cnpj;
    if (form.telefone && !validarTelefone(form.telefone)) e.telefone = MSG.telefone;
    if (form.email && !validarEmail(form.email)) e.email = MSG.email;
    if (modo === "nova") {
      if (form.emailRepresentante && !validarEmail(form.emailRepresentante)) e.emailRepresentante = MSG.email;
      if (form.cpfRepresentante && !validarCPF(form.cpfRepresentante)) e.cpfRepresentante = MSG.cpf;
    }
    return e;
  }

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    let payload: Record<string, string> = { ...form };
    if (modo === "editar") {
      const mudancas = Object.keys(CAMPOS_ESCOLA).filter((c) => String(editando[c] ?? "") !== String(form[c as keyof Form]));
      if (mudancas.length === 0) {
        feedback.info("Nenhuma informação foi alterada.");
        return;
      }
      const ok = await confirmar({
        titulo: "Salvar alterações da escola?",
        mensagem: `Confira as alterações em ${editando.nome}:`,
        detalhes: mudancas.map((c) => [
          CAMPOS_ESCOLA[c],
          `${editando[c] || "—"} → ${form[c as keyof Form] || "—"}`,
        ]),
        textoConfirmar: "Salvar alterações",
      });
      if (!ok) return;
      payload = Object.fromEntries(mudancas.map((c) => [c, form[c as keyof Form]]));
    } else {
      if (!payload.email) delete payload.email;
      if (!payload.cpfRepresentante) delete payload.cpfRepresentante;
    }

    setSalvando(true);
    try {
      if (modo === "editar") {
        await api.patch(`/escolas/${editando.id}`, payload);
        feedback.sucesso("Escola atualizada com sucesso.");
      } else {
        const { data } = await api.post("/escolas", payload);
        feedback.sucesso(`Escola ${data.escola.nome} cadastrada com sucesso.`);
        if (data.senhaTemporaria) {
          await avisar({
            titulo: "Anote a senha do administrador escolar",
            icone: "senha",
            mensagem:
              "O e-mail não pôde ser enviado (modo demonstração). Repasse estes dados ao administrador escolar. A senha não será mostrada de novo.",
            detalhes: [
              ["E-mail", data.administrador.email],
              ["Senha", data.senhaTemporaria],
            ],
          });
        }
      }
      voltar();
      await carregarEscolas();
    } catch (e) {
      const { mensagem, campos } = lerErro(e, "Não foi possível salvar a escola.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(escola: any) {
    const ok = await confirmar({
      titulo: `Excluir a escola ${escola.nome}?`,
      mensagem:
        "Todos os dados da escola serão apagados: administradores, professores, alunos, responsáveis, turmas, disciplinas, notas, chamadas, avisos e relatórios. Esta ação não pode ser desfeita.",
      detalhes: [
        ["CNPJ", escola.cnpj],
        ["Alunos", String((escola.alunos ?? []).length)],
        ["Professores", String((escola.professores ?? []).length)],
      ],
      textoConfirmar: "Excluir escola",
      perigo: true,
    });
    if (!ok) return;
    try {
      const { data } = await api.delete(`/escolas/${escola.id}`);
      feedback.sucesso(data.message ?? "Escola excluída.");
      await carregarEscolas();
    } catch (e) {
      feedback.erro(lerErro(e, "Não foi possível excluir a escola.").mensagem);
    }
  }

  const campo = (nome: keyof Form, rotulo: string, tipo = "text", placeholder = "") => (
    <div className="campo">
      <label htmlFor={`esc-${nome}`}>{rotulo}</label>
      <input
        id={`esc-${nome}`}
        name={nome}
        type={tipo}
        value={form[nome]}
        onChange={alterar}
        placeholder={placeholder}
        {...propsErro(nome, erros)}
      />
      <CampoErro id={`erro-${nome}`} mensagem={erros[nome]} />
    </div>
  );

  return (
    <>
      <SidebarAdminSistema />
      <main className="paginaAdminSistema">
        <div className="conteudo-escolas">
          <div className="topo-gerenciar">
            <h1>{modo === "lista" ? "Escolas cadastradas" : modo === "nova" ? "Nova escola" : "Editar escola"}</h1>
            {modo === "lista" && (
              <button type="button" className="botao-primario" onClick={abrirNova}>
                <FiPlus aria-hidden="true" /> Nova escola
              </button>
            )}
          </div>

          {modo === "lista" ? (
            <>
              <div className="barra-filtros">
                <label>
                  Buscar escola
                  <input
                    type="search"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Nome, CNPJ ou endereço"
                  />
                </label>
              </div>
              {escolas === null ? (
                <Carregando texto="Carregando escolas..." />
              ) : filtradas.length === 0 ? (
                <ListaVazia texto={busca ? "Nenhuma escola encontrada para a busca." : "Nenhuma escola cadastrada."} />
              ) : (
                <div className="tabela-scroll-container">
                  <table className="tabela-escolas">
                    <thead>
                      <tr>
                        <th scope="col">Nome</th>
                        <th scope="col">CNPJ</th>
                        <th scope="col">Endereço</th>
                        <th scope="col">Telefone</th>
                        <th scope="col">Setor educacional</th>
                        <th scope="col">Nº de alunos</th>
                        <th scope="col">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((escola) => (
                        <tr key={escola.id}>
                          <td className="coluna-destaque">
                            <strong>{escola.nome}</strong>
                          </td>
                          <td>{escola.cnpj}</td>
                          <td>{escola.endereco}</td>
                          <td>{escola.telefone}</td>
                          <td>{SETOR_EDUCACIONAL[escola.setorEducacional] ?? escola.setorEducacional}</td>
                          <td>{PORTE_ESCOLA[escola.numeroAlunos] ?? escola.numeroAlunos}</td>
                          <td>
                            <div className="acoes-tabela">
                              <button type="button" className="botao-editar" onClick={() => abrirEdicao(escola)}>
                                <FiEdit2 aria-hidden="true" /> Editar
                              </button>
                              <button type="button" className="botao-perigo" onClick={() => excluir(escola)}>
                                <FiTrash2 aria-hidden="true" /> Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <form className="form-cartao" onSubmit={salvar} noValidate>
              <h2>Dados da escola</h2>
              <div className="grade-campos">
                {campo("nome", "Nome da escola", "text", "Ex.: Escola Municipal Crescer")}
                {campo("cnpj", "CNPJ", "text", "00.000.000/0000-00")}
                {campo("endereco", "Endereço", "text", "Rua, número e bairro")}
                {campo("telefone", "Telefone", "tel", "(00) 00000-0000")}
                {campo("email", "E-mail da escola (opcional)", "email", "contato@escola.com")}
                <div className="campo">
                  <label htmlFor="esc-setorEducacional">Setor educacional</label>
                  <select id="esc-setorEducacional" name="setorEducacional" value={form.setorEducacional} onChange={alterar} {...propsErro("setorEducacional", erros)}>
                    <option value="">Selecione...</option>
                    <option value="infantil">Educação Infantil</option>
                    <option value="fundamental">Ensino Fundamental I</option>
                  </select>
                  <CampoErro id="erro-setorEducacional" mensagem={erros.setorEducacional} />
                </div>
                <div className="campo">
                  <label htmlFor="esc-numeroAlunos">Número de alunos</label>
                  <select id="esc-numeroAlunos" name="numeroAlunos" value={form.numeroAlunos} onChange={alterar} {...propsErro("numeroAlunos", erros)}>
                    <option value="">Selecione...</option>
                    {Object.entries(PORTE_ESCOLA).map(([v, r]) => (
                      <option key={v} value={v}>{r}</option>
                    ))}
                  </select>
                  <CampoErro id="erro-numeroAlunos" mensagem={erros.numeroAlunos} />
                </div>
              </div>

              {modo === "nova" && (
                <>
                  <h2>Administrador escolar</h2>
                  <p className="texto-ajuda">Esta pessoa recebe o acesso de administrador da escola.</p>
                  <div className="grade-campos">
                    {campo("nomeRepresentante", "Nome completo", "text", "Nome do administrador")}
                    {campo("emailRepresentante", "E-mail (login)", "email", "admin@escola.com")}
                    {campo("cpfRepresentante", "CPF (opcional)", "text", "000.000.000-00")}
                    {campo("cargoRepresentante", "Cargo", "text", "Ex.: Diretora")}
                  </div>
                </>
              )}

              <div className="acoes-formulario">
                <button type="button" className="botao-secundario" onClick={voltar}>
                  Cancelar
                </button>
                <button type="submit" className="botao-primario" disabled={salvando}>
                  {salvando ? "Salvando..." : modo === "nova" ? "Cadastrar escola" : "Salvar alterações"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
