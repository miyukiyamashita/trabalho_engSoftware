import { BadRequestException, ConflictException } from '@nestjs/common';

export const STATUS_SOLICITACAO = ['PENDENTE', 'APROVADA', 'REJEITADA'] as const;
export type StatusSolicitacao = (typeof STATUS_SOLICITACAO)[number];

/** RF03: só é possível decidir solicitações pendentes, e a decisão precisa ser válida. */
export function validarDecisao(solicitacao: { status?: string }, novoStatus: string) {
  if (novoStatus !== 'APROVADA' && novoStatus !== 'REJEITADA') {
    throw new BadRequestException('A decisão deve ser APROVADA ou REJEITADA.');
  }
  if (solicitacao.status !== 'PENDENTE') {
    throw new ConflictException('Esta solicitação já foi decidida e não pode ser alterada.');
  }
}

export function filtrarPorStatus<T extends { status?: string }>(lista: T[], status?: string) {
  const ordenada = [...lista].sort((a: any, b: any) =>
    String(b.dataSolicitacao ?? '').localeCompare(String(a.dataSolicitacao ?? '')),
  );
  return status ? ordenada.filter((s) => s.status === status) : ordenada;
}
