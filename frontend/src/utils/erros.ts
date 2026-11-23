/**
 * Lê o erro devolvido pela API e separa:
 *  - mensagem geral (para o aviso no topo da tela);
 *  - erros por campo (para exibir abaixo de cada campo, H9).
 */
export type ErroApi = { mensagem: string; campos: Record<string, string>; status?: number };

export function lerErro(erro: unknown, padrao = "Não foi possível concluir a operação. Tente novamente."): ErroApi {
  const resposta = (erro as { response?: { status?: number; data?: unknown } })?.response;
  if (!resposta) {
    return {
      mensagem: "Sem conexão com o servidor. Verifique se o sistema está no ar e tente novamente.",
      campos: {},
    };
  }
  const dados = (resposta.data ?? {}) as { message?: string | string[]; campos?: Record<string, string> };
  const mensagem = Array.isArray(dados.message) ? dados.message.join(" ") : dados.message;
  const semPermissao = resposta.status === 403 && !dados.campos;
  return {
    mensagem: semPermissao
      ? mensagem || "Você não tem permissão para esta ação."
      : mensagem || padrao,
    campos: dados.campos ?? {},
    status: resposta.status,
  };
}
