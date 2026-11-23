import { useCallback, useState } from "react";
import { CampoErro, propsErro } from "./Campos";

type Valores = Record<string, any>;

/** Estado de formulário com erros por campo (H9). */
export function useFormulario<T extends Valores>(inicial: T) {
  const [form, setForm] = useState<T>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});

  const alterar = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((f) => ({ ...f, [name]: value }));
      setErros((prev) => {
        if (!prev[name]) return prev;
        const copia = { ...prev };
        delete copia[name];
        return copia;
      });
    },
    []
  );

  const definir = useCallback((campo: keyof T, valor: any) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((prev) => {
      if (!prev[campo as string]) return prev;
      const copia = { ...prev };
      delete copia[campo as string];
      return copia;
    });
  }, []);

  return { form, setForm, erros, setErros, alterar, definir };
}

type CampoProps = {
  id: string;
  nome: string;
  rotulo: string;
  valor: string;
  erros: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tipo?: string;
  placeholder?: string;
  dica?: string;
  max?: string;
};

/** Campo de texto com label ligado (htmlFor), dica e mensagem de erro abaixo (T30/H9). */
export function CampoTexto({ id, nome, rotulo, valor, erros, onChange, tipo = "text", placeholder, dica, max }: CampoProps) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        name={nome}
        type={tipo}
        value={valor}
        onChange={onChange}
        placeholder={placeholder}
        max={max}
        {...propsErro(nome, erros)}
      />
      {dica && !erros[nome] && <span className="dica-campo">{dica}</span>}
      <CampoErro id={`erro-${nome}`} mensagem={erros[nome]} />
    </div>
  );
}

/** Lista "campo: antes → depois" para o resumo da confirmação de edição (RNF07). */
export function diferencas(original: Valores, atual: Valores, rotulos: Record<string, string>, formatar?: (campo: string, v: any) => string) {
  const f = (c: string, v: any) => (formatar ? formatar(c, v) : String(v ?? "")) || "—";
  return Object.keys(rotulos)
    .filter((c) => String(original?.[c] ?? "") !== String(atual?.[c] ?? ""))
    .map((c) => [rotulos[c], `${f(c, original?.[c])} → ${f(c, atual?.[c])}`] as [string, string]);
}

/** Mantém só os campos alterados (atualização parcial no backend). */
export function somenteAlterados(original: Valores, atual: Valores, campos: string[]) {
  return Object.fromEntries(campos.filter((c) => String(original?.[c] ?? "") !== String(atual?.[c] ?? "")).map((c) => [c, atual[c]]));
}
