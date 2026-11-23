import { ConflictException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { EmailService } from '../email/email.service';
import { EscolasService } from '../escolas/escolas.service';
import { somenteDigitos } from '../common/escopo';
import { filtrarPorStatus, validarDecisao } from '../common/solicitacoes';

const CAMPOS = [
  'nomeInstituicao',
  'cnpj',
  'endereco',
  'telefone',
  'emailInstituicao',
  'setorEducacional',
  'nomeRepresentante',
  'cpfRepresentante',
  'emailRepresentante',
  'cargo',
  'numeroAlunos',
] as const;

@Injectable()
export class SolicitacaoCadastroService {
  private readonly colecao = 'solicitacoesCadastro';

  constructor(
    private readonly db: DbService,
    private readonly escolas: EscolasService,
    private readonly emailService: EmailService,
  ) {}

  /** RF01: solicitação pública de cadastro da instituição. */
  async create(dados: any) {
    const cnpj = somenteDigitos(dados.cnpj);
    const escolaExistente = (await this.db.list('escolas')).find((e) => somenteDigitos(e.cnpj) === cnpj);
    const pendente = (await this.db.list(this.colecao, { status: 'PENDENTE' })).find(
      (s) => somenteDigitos(s.cnpj) === cnpj,
    );
    if (escolaExistente || pendente) {
      throw new ConflictException({
        message: escolaExistente ? 'Esta escola já está cadastrada.' : 'Já existe uma solicitação pendente para este CNPJ.',
        campos: {
          cnpj: escolaExistente
            ? 'Este CNPJ já pertence a uma escola cadastrada.'
            : 'Já existe uma solicitação em análise para este CNPJ. Aguarde o e-mail com o resultado.',
        },
      });
    }

    const registro: Record<string, any> = { status: 'PENDENTE', dataSolicitacao: new Date().toISOString() };
    for (const campo of CAMPOS) registro[campo] = dados[campo];
    const criada = await this.db.create(this.colecao, registro);
    return { id: criada.id, status: criada.status };
  }

  async findAll(status?: string) {
    return filtrarPorStatus(await this.db.list(this.colecao), status);
  }

  findOne(id: string) {
    return this.db.get(this.colecao, id, 'Solicitação não encontrada.');
  }

  /** Consulta pública e mínima do status (sem dados pessoais). */
  async statusPublico(id: string) {
    const s = await this.findOne(id);
    return { id: s.id, nomeInstituicao: s.nomeInstituicao, status: s.status };
  }

  /** RF03: aprova (cria escola + admin) ou rejeita uma solicitação pendente. */
  async decidir(id: string, novoStatus: string) {
    const solicitacao = await this.findOne(id);
    validarDecisao(solicitacao, novoStatus);

    if (novoStatus === 'REJEITADA') {
      const atualizada = await this.db.patch(this.colecao, id, {
        status: 'REJEITADA',
        dataDecisao: new Date().toISOString(),
      });
      const emailEnviado = await this.emailService.enviarEmailReprovacao(
        solicitacao.nomeRepresentante,
        solicitacao.emailRepresentante,
        solicitacao.nomeInstituicao,
      );
      return { solicitacao: atualizada, emailEnviado };
    }

    // Cria primeiro; só marca como aprovada se a escola e o admin foram criados.
    const resultado = await this.escolas.criarComAdmin({
      nome: solicitacao.nomeInstituicao,
      cnpj: solicitacao.cnpj,
      endereco: solicitacao.endereco,
      telefone: solicitacao.telefone,
      email: solicitacao.emailInstituicao,
      setorEducacional: solicitacao.setorEducacional,
      numeroAlunos: solicitacao.numeroAlunos,
      nomeRepresentante: solicitacao.nomeRepresentante,
      cpfRepresentante: solicitacao.cpfRepresentante,
      emailRepresentante: solicitacao.emailRepresentante,
      cargoRepresentante: solicitacao.cargo,
    });

    const atualizada = await this.db.patch(this.colecao, id, {
      status: 'APROVADA',
      dataDecisao: new Date().toISOString(),
      escolaId: resultado.escola.id,
    });
    await this.emailService.enviarEmailAprovacao(
      solicitacao.nomeRepresentante,
      solicitacao.emailRepresentante,
      solicitacao.nomeInstituicao,
    );

    return {
      solicitacao: atualizada,
      emailAdmin: resultado.administrador.email,
      emailEnviado: resultado.emailEnviado,
      senhaTemporaria: resultado.senhaTemporaria,
    };
  }
}
