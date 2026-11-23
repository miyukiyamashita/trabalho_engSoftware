/** Textos no vocabulário do usuário (H2). */
export const STATUS_SOLICITACAO: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
};

export const SETOR_EDUCACIONAL: Record<string, string> = {
  infantil: "Educação Infantil",
  fundamental: "Ensino Fundamental I",
};

export const PORTE_ESCOLA: Record<string, string> = {
  "0-100": "Até 100 alunos",
  "101-500": "101 a 500 alunos",
  "501-1000": "501 a 1000 alunos",
  "1000+": "Mais de 1000 alunos",
};

export const CAMPOS_ESCOLA: Record<string, string> = {
  nome: "Nome da escola",
  cnpj: "CNPJ",
  endereco: "Endereço",
  telefone: "Telefone",
  email: "E-mail",
  setorEducacional: "Setor educacional",
  numeroAlunos: "Número de alunos",
};

export function formatarData(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  if (!dia) return valor;
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(valor?: string | null) {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
