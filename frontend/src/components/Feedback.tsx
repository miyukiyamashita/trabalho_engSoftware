import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

type Tipo = "sucesso" | "erro" | "info";
type Mensagem = { id: number; tipo: Tipo; texto: string };

type FeedbackContexto = {
  sucesso: (texto: string) => void;
  erro: (texto: string) => void;
  info: (texto: string) => void;
};

const Contexto = createContext<FeedbackContexto>({} as FeedbackContexto);

const ICONES = { sucesso: FiCheckCircle, erro: FiAlertCircle, info: FiInfo };

/**
 * Componente único de feedback (H1/H9), no lugar das várias cópias de "acionarModal".
 * Mensagens aparecem no canto da tela, são anunciadas por leitores de tela (aria-live)
 * e podem ser fechadas. Erros ficam mais tempo na tela.
 */
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const proximoId = useRef(1);

  const fechar = useCallback((id: number) => {
    setMensagens((atuais) => atuais.filter((m) => m.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo: Tipo, texto: string) => {
      const id = proximoId.current++;
      setMensagens((atuais) => [...atuais.slice(-2), { id, tipo, texto }]);
      window.setTimeout(() => fechar(id), tipo === "erro" ? 9000 : 5000);
    },
    [fechar]
  );

  // Objeto estável: as telas podem usar o feedback em dependências de efeitos sem recarregar em loop.
  const valor = useMemo<FeedbackContexto>(
    () => ({
      sucesso: (t: string) => mostrar("sucesso", t),
      erro: (t: string) => mostrar("erro", t),
      info: (t: string) => mostrar("info", t),
    }),
    [mostrar]
  );

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="feedback-regiao" aria-live="polite" aria-atomic="false">
        {mensagens.map((m) => {
          const Icone = ICONES[m.tipo];
          return (
            <div key={m.id} className={`feedback feedback-${m.tipo}`} role={m.tipo === "erro" ? "alert" : "status"}>
              <Icone aria-hidden="true" className="feedback-icone" />
              <p>{m.texto}</p>
              <button type="button" className="feedback-fechar" onClick={() => fechar(m.id)} aria-label="Fechar mensagem">
                <FiX aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeedback() {
  return useContext(Contexto);
}
