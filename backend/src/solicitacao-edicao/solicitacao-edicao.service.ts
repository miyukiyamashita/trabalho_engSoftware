import { BadRequestException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { CAMPOS_EDITAVEIS_ESCOLA, EscolasService } from '../escolas/escolas.service';
import { UsuarioLogado, escolaDoUsuario } from '../common/escopo';
import { filtrarPorStatus, validarDecisao } from '../common/solicitacoes';

@Injectable()
export class SolicitacaoEdicaoService {
  private readonly colecao = 'solicitacoesEdicao';

  constructor(
    private readonly db: DbService,
    private readonly escolas: EscolasService,
  ) {}

  /** RF05: o admin escolar pede a edição de um campo da própria escola. */
  async create(dados: any, user: UsuarioLogado) {
    const escola = await this.escolas.findOne(escolaDoUsuario(user));
    if (!(CAMPOS_EDITAVEIS_ESCOLA as readonly string[]).includes(dados.informacao)) {
      throw new BadRequestException({
        message: 'Informação inválida.',
        campos: { informacao: 'Escolha na lista qual informação da escola deve ser alterada.' },
      });
    }
    return this.db.create(this.colecao, {
      idEscola: String(escola.id),
      nomeEscola: escola.nome,
      informacao: dados.informacao,
      valorAtual: escola[dados.informacao] ?? null,
      alteracao: dados.alteracao,
      status: 'PENDENTE',
      dataSolicitacao: new Date().toISOString(),
      solicitanteId: String(user.id),
    });
  }

  async findAll(status?: string) {
    return filtrarPorStatus(await this.db.list(this.colecao), status);
  }

  findOne(id: string) {
    return this.db.get(this.colecao, id, 'Solicitação não encontrada.');
  }

  /** RF03: decide apenas solicitações pendentes; aprovar aplica a alteração permitida. */
  async decidir(id: string, novoStatus: string) {
    const solicitacao = await this.findOne(id);
    validarDecisao(solicitacao, novoStatus);
    if (novoStatus === 'APROVADA') {
      await this.escolas.update(solicitacao.idEscola, { [solicitacao.informacao]: solicitacao.alteracao });
    }
    const atualizada = await this.db.patch(this.colecao, id, {
      status: novoStatus,
      dataDecisao: new Date().toISOString(),
    });
    return { solicitacao: atualizada };
  }
}
