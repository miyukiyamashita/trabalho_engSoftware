import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertTriangle, FiHelpCircle, FiKey } from "react-icons/fi";

export type OpcoesConfirmacao = {
  titulo: string;
  mensagem?: string;
  /** Resumo da ação: pares [rótulo, valor] exibidos em lista. */
  detalhes?: Array<[string, string]>;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Ação destrutiva (exclusão, remoção): botão vermelho. */
  perigo?: boolean;
  /** Só informa (um botão "Entendi"), sem cancelar. */
  somenteAviso?: boolean;
  icone?: "senha";
};

type Pendente = OpcoesConfirmacao & { resolver: (ok: boolean) => void };

const Contexto = createContext<{
  confirmar: (o: OpcoesConfirmacao) => Promise<boolean>;
  avisar: (o: OpcoesConfirmacao) => Promise<boolean>;
}>({ confirmar: async () => false, avisar: async () => true });

/**
 * ConfirmDialog (RNF07 / H5 / H3): substitui window.confirm mostrando o resumo
 * da ação. Esc ou "Cancelar" desistem; o foco fica preso dentro da janela.
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<HTMLElement | null>(null);

  const abrir = useCallback((opcoes: OpcoesConfirmacao) => {
    focoAnterior.current = document.activeElement as HTMLElement;
    return new Promise<boolean>((resolver) => setPendente({ ...opcoes, resolver }));
  }, []);

  const confirmar = useCallback((o: OpcoesConfirmacao) => abrir(o), [abrir]);
  const avisar = useCallback((o: OpcoesConfirmacao) => abrir({ ...o, somenteAviso: true }), [abrir]);

  const responder = useCallback(
    (ok: boolean) => {
      pendente?.resolver(ok);
      setPendente(null);
      window.setTimeout(() => focoAnterior.current?.focus?.(), 0);
    },
    [pendente]
  );

  useEffect(() => {
    if (!pendente) return;
    const botoes = caixa.current?.querySelectorAll<HTMLButtonElement>("button");
    // Em ações perigosas o foco começa no "Cancelar", para evitar confirmação acidental.
    const inicial = pendente.perigo && !pendente.somenteAviso ? botoes?.[0] : botoes?.[botoes.length - 1];
    inicial?.focus();

    function teclado(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        responder(pendente!.somenteAviso ? true : false);
      }
      if (e.key === "Tab" && botoes && botoes.length > 0) {
        const primeiro = botoes[0];
        const ultimo = botoes[botoes.length - 1];
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primeiro.focus();
        }
      }
    }
    document.addEventListener("keydown", teclado);
    return () => document.removeEventListener("keydown", teclado);
  }, [pendente, responder]);

  const valor = useMemo(() => ({ confirmar, avisar }), [confirmar, avisar]);

  const Icone = pendente?.icone === "senha" ? FiKey : pendente?.perigo ? FiAlertTriangle : FiHelpCircle;

  return (
    <Contexto.Provider value={valor}>
      {children}
      {pendente && (
        <div className="dialogo-fundo" onMouseDown={(e) => e.target === e.currentTarget && !pendente.somenteAviso && responder(false)}>
          <div
            ref={caixa}
            className={`dialogo ${pendente.perigo ? "dialogo-perigo" : ""}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialogo-titulo"
            aria-describedby="dialogo-mensagem"
          >
            <div className="dialogo-cabecalho">
              <Icone aria-hidden="true" className="dialogo-icone" />
              <h2 id="dialogo-titulo">{pendente.titulo}</h2>
            </div>
            {pendente.mensagem && <p id="dialogo-mensagem">{pendente.mensagem}</p>}
            {pendente.detalhes && pendente.detalhes.length > 0 && (
              <dl className="dialogo-detalhes">
                {pendente.detalhes.map(([rotulo, valor]) => (
                  <div key={rotulo}>
                    <dt>{rotulo}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="dialogo-botoes">
              {!pendente.somenteAviso && (
                <button type="button" className="botao-secundario" onClick={() => responder(false)}>
                  {pendente.textoCancelar ?? "Cancelar"}
                </button>
              )}
              <button
                type="button"
                className={pendente.perigo ? "botao-perigo" : "botao-primario"}
                onClick={() => responder(true)}
              >
                {pendente.textoConfirmar ?? (pendente.somenteAviso ? "Entendi" : "Confirmar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </Contexto.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  return useContext(Contexto);
}
