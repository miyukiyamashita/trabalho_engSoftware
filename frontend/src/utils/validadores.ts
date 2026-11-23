/** Validações feitas antes de enviar (H5). O backend repete as mesmas regras. */
export function validarTelefone(telefone: string) {
    return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefone.trim());
}

export function validarCPF(cpf: string) {
    return /^\d{11}$/.test(cpf.replace(/\D/g, ""));
}

export function validarCNPJ(cnpj: string) {
    return /^\d{14}$/.test(cnpj.replace(/\D/g, ""));
}

export function validarEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Data AAAA-MM-DD (campo type="date") válida e que não seja futura. */
export function validarDataPassada(data: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
    const d = new Date(`${data}T12:00:00Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== data) return false;
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
    return data <= hoje;
}

export function validarCargaHoraria(cargaHoraria: string) {
    const numero = Number(cargaHoraria);
    return Number.isInteger(numero) && numero >= 1 && numero <= 40;
}

/** Mensagens padronizadas: dizem o problema e como corrigir (H9). */
export const MSG = {
    obrigatorio: (campo: string) => `Preencha o campo ${campo}.`,
    cpf: "CPF inválido: digite os 11 números (ex.: 123.456.789-09).",
    cnpj: "CNPJ inválido: digite os 14 números (ex.: 12.345.678/0001-90).",
    telefone: "Telefone inválido: informe DDD e número (ex.: (32) 99999-1234).",
    email: "E-mail inválido: use o formato nome@dominio.com.",
    data: "Data inválida: escolha uma data válida que não seja futura.",
};

/** Verifica campos obrigatórios e devolve { campo: mensagem }. */
export function obrigatorios(form: Record<string, unknown>, rotulos: Record<string, string>) {
    const erros: Record<string, string> = {};
    for (const [campo, rotulo] of Object.entries(rotulos)) {
        const valor = form[campo];
        if (valor === undefined || valor === null || String(valor).trim() === "") {
            erros[campo] = MSG.obrigatorio(rotulo);
        }
    }
    return erros;
}
