import { Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { EscolasService } from '../escolas/escolas.service';
import { UsuarioLogado, escolaDoUsuario } from '../common/escopo';
import { filtrarPorStatus, validarDecisao } from '../common/solicitacoes';

@Injectable()
export class SolicitacaoRemocaoService {
  private readonly colecao = 'solicitacoesRemocao';

  constructor(
    private readonly db: DbService,
    private readonly escolas: EscolasService,
  ) {}

  /** RF05: o admin escolar pede a remoção da própria escola. */
  async create(dados: any, user: UsuarioLogado) {
    const escola = await this.escolas.findOne(escolaDoUsuario(user));
    return this.db.create(this.colecao, {
      idEscola: String(escola.id),
      nomeEscola: escola.nome,
      cnpjEscola: escola.cnpj,
      justificativa: dados.justificativa,
      status: 'PENDENTE',
      dataSolicitacao: new Date().toISOString(),
      solicitanteId: String(user.id),
    });
  }

  async findAll(status?: string) {
    const lista = filtrarPorStatus(await this.db.list(this.colecao), status);
    const escolas = await this.db.list('escolas');
    return lista.map((s) => ({ ...s, escola: escolas.find((e) => String(e.id) === String(s.idEscola)) ?? null }));
  }

  findOne(id: string) {
    return this.db.get(this.colecao, id, 'Solicitação não encontrada.');
  }

  /** RF03: aprovar remove a escola em cascata por escolaId (T6). A solicitação fica como histórico. */
  async decidir(id: string, novoStatus: string) {
    const solicitacao = await this.findOne(id);
    validarDecisao(solicitacao, novoStatus);
    if (novoStatus === 'APROVADA') {
      await this.escolas.removerEmCascata(solicitacao.idEscola);
    }
    const atualizada = await this.db.patch(this.colecao, id, {
      status: novoStatus,
      dataDecisao: new Date().toISOString(),
    });
    return { solicitacao: atualizada };
  }
}
