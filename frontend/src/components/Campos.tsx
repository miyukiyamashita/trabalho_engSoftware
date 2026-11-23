import { FiAlertCircle } from "react-icons/fi";

/** Mensagem de erro exibida abaixo do campo, dizendo o problema e como corrigir (H9). */
export function CampoErro({ id, mensagem }: { id: string; mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <span className="erro-campo" id={id}>
      <FiAlertCircle aria-hidden="true" /> {mensagem}
    </span>
  );
}

/** Props de acessibilidade para ligar o campo à sua mensagem de erro. */
export function propsErro(nome: string, erros: Record<string, string>) {
  const temErro = Boolean(erros[nome]);
  return {
    "aria-invalid": temErro || undefined,
    "aria-describedby": temErro ? `erro-${nome}` : undefined,
    className: temErro ? "campo-invalido" : undefined,
  };
}

/** Indicador de carregamento das listagens (H1). */
export function Carregando({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <p className="carregando" role="status">
      <span className="spinner" aria-hidden="true" /> {texto}
    </p>
  );
}

/** Mensagem para lista vazia. */
export function ListaVazia({ texto }: { texto: string }) {
  return <p className="lista-vazia">{texto}</p>;
}
