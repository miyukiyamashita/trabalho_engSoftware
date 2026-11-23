import { useCallback, useEffect, useRef, useState } from "react";
import Select from "react-select";
import { FiBell, FiInfo } from "react-icons/fi";
import "../pages/AdminEscolar/avisosAdminEscolar.css";
import { api } from "../services/api";
import { useFeedback } from "./Feedback";
import { CampoErro, Carregando, ListaVazia, propsErro } from "./Campos";
import { useFormulario } from "./Formulario";
import { lerErro } from "../utils/erros";
import { formatarDataHora } from "../utils/formatar";

const formInicial = { publico: [] as string[], tipoAviso: "informativo", tituloAviso: "", descricao: "" };

const TIPOS = [
  { valor: "informativo", titulo: "Informativo", descricao: "Mensagem geral para informar algo.", Icone: FiInfo, classe: "icone-info" },
  { valor: "alerta", titulo: "Alerta", descricao: "Aviso importante ou urgente.", Icone: FiBell, classe: "icone-alerta" },
];

/**
 * RF10: professores e administradores escolares enviam avisos às turmas.
 * Na aba Visualizar, "x/y lidos" compara com o número de responsáveis destinatários (RF13).
 */
export function TelaAvisos({ Sidebar, rotuloPublico }: { Sidebar: () => React.ReactElement; rotuloPublico: string }) {
  const feedback = useFeedback();
  const [aba, setAba] = useState<"envio" | "visualizacao">("envio");
  const [turmas, setTurmas] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const { form, setForm, erros, setErros, alterar, definir } = useFormulario(formInicial);
  const tiposRef = useRef<Array<HTMLButtonElement | null>>([]);

  const buscarAvisos = useCallback(async () => {
    try {
      const { data } = await api.get("/avisos");
      setAvisos(data);
    } catch (e) {
      setAvisos((atual) => atual ?? []);
      feedback.erro(lerErro(e, "Não foi possível carregar a lista de avisos.").mensagem);
    }
  }, [feedback]);

  useEffect(() => {
    api
      .get("/turmas")
      .then((r) => setTurmas(r.data))
      .catch((e) => feedback.erro(lerErro(e, "Não foi possível carregar as turmas.").mensagem));
  }, [feedback]);

  // Atualiza as leituras periodicamente só enquanto a aba está aberta; o intervalo é limpo ao sair (T14).
  useEffect(() => {
    if (aba !== "visualizacao") return;
    buscarAvisos();
    const intervalo = window.setInterval(buscarAvisos, 15000);
    return () => window.clearInterval(intervalo);
  }, [aba, buscarAvisos]);

  const opcoesTurmas = turmas.map((t) => ({ value: String(t.id), label: `${t.nomeTurma} - ${t.turno}` }));

  function limpar() {
    setForm(formInicial);
    setErros({});
  }

  function teclaTipo(e: React.KeyboardEvent, indice: number) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const proximo = (indice + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : TIPOS.length - 1)) % TIPOS.length;
    definir("tipoAviso", TIPOS[proximo].valor);
    tiposRef.current[proximo]?.focus();
  }

  async function enviarAviso(e: React.FormEvent) {
    e.preventDefault();
    const encontrados: Record<string, string> = {};
    if (form.publico.length === 0) encontrados.publico = "Escolha ao menos uma turma para receber o aviso.";
    if (form.tituloAviso.trim().length < 3) encontrados.tituloAviso = "Título: use pelo menos 3 caracteres.";
    if (form.descricao.trim().length < 5) encontrados.descricao = "Mensagem: use pelo menos 5 caracteres.";
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      feedback.erro("Há campos com problema. Corrija os itens destacados em vermelho.");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/avisos", form);
      const nomes = opcoesTurmas.filter((o) => form.publico.includes(o.value)).map((o) => o.label).join(", ");
      feedback.sucesso(`Aviso "${form.tituloAviso}" enviado para ${nomes}.`);
      limpar();
    } catch (erro) {
      const { mensagem, campos } = lerErro(erro, "Não foi possível enviar o aviso.");
      setErros(campos);
      feedback.erro(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <main className="conteudo-principal-avisos">
        <div className="cabecalho-abas-avisos">
          <h1 className="titulo-pagina">{aba === "envio" ? "Envio de aviso" : "Avisos enviados"}</h1>
          <div className="botoes-alternador-avisos" role="tablist" aria-label="Modo da tela">
            <button type="button" role="tab" aria-selected={aba === "envio"} className={aba === "envio" ? "botao-aba ativo" : "botao-aba"} onClick={() => setAba("envio")}>
              Enviar
            </button>
            <button type="button" role="tab" aria-selected={aba === "visualizacao"} className={aba === "visualizacao" ? "botao-aba ativo" : "botao-aba"} onClick={() => setAba("visualizacao")}>
              Visualizar
            </button>
          </div>
        </div>

        {aba === "envio" ? (
          <form className="envio-avisos" onSubmit={enviarAviso} noValidate>
            <div className="campo">
              <label htmlFor="aviso-publico">{rotuloPublico}</label>
              <Select
                inputId="aviso-publico"
                isMulti
                classNamePrefix="selecionar-turmas"
                placeholder="Selecione as turmas..."
                noOptionsMessage={() => "Nenhuma turma disponível"}
                options={opcoesTurmas}
                value={opcoesTurmas.filter((o) => form.publico.includes(o.value))}
                className={erros.publico ? "campo-invalido" : ""}
                aria-invalid={Boolean(erros.publico)}
                onChange={(sel) => definir("publico", sel.map((s) => s.value))}
              />
              <span className="dica-campo">Os responsáveis pelos alunos dessas turmas vão receber o aviso.</span>
              <CampoErro id="erro-publico" mensagem={erros.publico} />
            </div>

            <div className="campo">
              <span className="rotulo-grupo" id="rotulo-tipo-aviso">Tipo de aviso:</span>
              <div className="tipo-aviso" role="radiogroup" aria-labelledby="rotulo-tipo-aviso">
                {TIPOS.map(({ valor, titulo, descricao, Icone, classe }, i) => (
                  <button
                    key={valor}
                    type="button"
                    role="radio"
                    aria-checked={form.tipoAviso === valor}
                    tabIndex={form.tipoAviso === valor ? 0 : -1}
                    ref={(el) => {
                      tiposRef.current[i] = el;
                    }}
                    className={`card-aviso ${form.tipoAviso === valor ? "selecionado" : ""}`}
                    onClick={() => definir("tipoAviso", valor)}
                    onKeyDown={(e) => teclaTipo(e, i)}
                  >
                    <Icone aria-hidden="true" className={classe} />
                    <div>
                      <h4>{titulo}</h4>
                      <p>{descricao}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="campo campo-largo">
              <label htmlFor="aviso-titulo">Título:</label>
              <input id="aviso-titulo" type="text" name="tituloAviso" value={form.tituloAviso} onChange={alterar} placeholder="Ex.: Reunião de pais" {...propsErro("tituloAviso", erros)} />
              <CampoErro id="erro-tituloAviso" mensagem={erros.tituloAviso} />
            </div>

            <div className="campo campo-largo">
              <label htmlFor="aviso-descricao">Mensagem:</label>
              <textarea id="aviso-descricao" name="descricao" value={form.descricao} onChange={alterar} placeholder="Escreva a mensagem para os responsáveis..." rows={7} {...propsErro("descricao", erros)} />
              <CampoErro id="erro-descricao" mensagem={erros.descricao} />
            </div>

            <div className="acoes-formulario">
              <button type="button" className="botao-secundario" onClick={limpar}>
                Cancelar
              </button>
              <button type="submit" className="botao-primario" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar aviso"}
              </button>
            </div>
          </form>
        ) : (
          <div className="container-lista-avisos">
            {avisos === null ? (
              <Carregando texto="Carregando avisos..." />
            ) : avisos.length === 0 ? (
              <ListaVazia texto="Nenhum aviso enviado ainda. Use a aba Enviar." />
            ) : (
              <div className="box-borda-avisos">
                <ul className="box-scroll-avisos" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {avisos.map((aviso) => (
                    <li className="linha-aviso" key={aviso.id}>
                      <div className="aviso-esquerda">
                        <span
                          className={`bolinha-status ${aviso.tipoAviso === "alerta" ? "vermelha" : "azul"}`}
                          title={aviso.tipoAviso === "alerta" ? "Alerta" : "Informativo"}
                        />
                        <div className="aviso-textos">
                          <h4>
                            {aviso.tipoAviso === "alerta" ? "Alerta: " : ""}
                            {aviso.tituloAviso}
                          </h4>
                          <p>{aviso.descricao}</p>
                          <span className="aviso-meta">
                            Para: {(aviso.nomesTurmas ?? []).join(", ") || "—"}
                            {aviso.nomeRemetente ? ` · Enviado por ${aviso.nomeRemetente}` : ""}
                          </span>
                        </div>
                      </div>
                      <div className="aviso-direita">
                        <span className="aviso-data">{formatarDataHora(aviso.dataCriacao)}</span>
                        <span
                          className={`badge-lidos ${aviso.totalLidos > 0 ? "status-lido" : "status-nao-lido"}`}
                          aria-label={`${aviso.totalLidos} de ${aviso.totalDestinatarios} responsáveis leram`}
                        >
                          <strong>{aviso.totalLidos}</strong>/{aviso.totalDestinatarios} responsáveis leram
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
      <Sidebar />
    </>
  );
}
