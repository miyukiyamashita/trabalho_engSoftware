import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import { UsuarioLogado, escolaDoUsuario } from '../common/escopo';
import { normalizarEmail } from '../usuarios/usuarios.service';

@Injectable()
export class AvisosService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
  ) {}

  /** Turmas que o usuário pode usar como destinatário (RF10). */
  private async turmasPermitidas(user: UsuarioLogado) {
    if (user.tipo === TipoUsuario.PROF) return this.acesso.turmasDoProfessor(String(user.perfilId));
    return this.db.list('turmas', { escolaId: escolaDoUsuario(user) });
  }

  async create(dados: any, user: UsuarioLogado) {
    const turmas = await this.turmasPermitidas(user);
    const permitidas = turmas.map((t) => String(t.id));
    const publico: string[] = (dados.publico ?? []).map(String);
    if (publico.length === 0 || publico.some((id) => !permitidas.includes(id))) {
      throw new ForbiddenException({
        message: 'Destinatários inválidos.',
        campos: { publico: 'Escolha apenas turmas em que você atua.' },
      });
    }

    const escolaId = String(turmas[0]?.escolaId ?? user.escolaId);
    const aviso = await this.db.create('avisos', {
      publico,
      tipoAviso: dados.tipoAviso === 'alerta' ? 'alerta' : 'informativo',
      tituloAviso: dados.tituloAviso,
      descricao: dados.descricao,
      dataCriacao: new Date().toISOString(),
      escolaId,
      remetenteId: String(user.id),
      tipoRemetente: user.tipo === TipoUsuario.PROF ? 'professor' : 'admin_escolar',
      nomeRemetente: user.nome ?? null,
      responsaveisQueLeram: [],
    });

    const escola = await this.db.find('escolas', escolaId);
    if (escola) await this.db.patch('escolas', escolaId, { avisos: [...(escola.avisos ?? []), aviso.dataCriacao] });
    return aviso;
  }

  /** E-mails distintos dos responsáveis pelos alunos das turmas do aviso. */
  private destinatarios(aviso: any, turmas: any[], alunos: any[]) {
    const ids = new Set<string>();
    for (const turma of turmas.filter((t) => (aviso.publico ?? []).map(String).includes(String(t.id)))) {
      for (const alunoId of turma.alunos ?? []) ids.add(String(alunoId));
    }
    return new Set(alunos.filter((a) => ids.has(String(a.id))).map((a) => normalizarEmail(a.emailResponsavel)));
  }

  /**
   * Admin escolar: avisos da escola. Professor: os que enviou e os das suas turmas.
   * Responsável: avisos das turmas dos filhos. Para quem envia, devolve "x/y lidos"
   * comparando com o número de responsáveis destinatários (RF13).
   */
  async findAll(user: UsuarioLogado) {
    if (user.tipo === TipoUsuario.RESPONSAVEL) return this.meus(user);

    const turmas = await this.turmasPermitidas(user);
    const escolaId = String(user.escolaId ?? turmas[0]?.escolaId ?? '');
    const idsTurmas = turmas.map((t) => String(t.id));
    const todos = await this.db.list('avisos', { escolaId });
    const visiveis =
      user.tipo === TipoUsuario.PROF
        ? todos.filter(
            (a) =>
              String(a.remetenteId) === String(user.id) ||
              (a.publico ?? []).some((id: any) => idsTurmas.includes(String(id))),
          )
        : todos;

    const todasTurmas = await this.db.list('turmas', { escolaId });
    const alunos = await this.db.list('alunos', { escolaId });
    return visiveis
      .map((aviso) => {
        const destinatarios = this.destinatarios(aviso, todasTurmas, alunos);
        const lidos = (aviso.responsaveisQueLeram ?? []).filter((e: string) => destinatarios.has(normalizarEmail(e)));
        return {
          ...aviso,
          totalDestinatarios: destinatarios.size,
          totalLidos: lidos.length,
          nomesTurmas: todasTurmas
            .filter((t) => (aviso.publico ?? []).map(String).includes(String(t.id)))
            .map((t) => t.nomeTurma),
        };
      })
      .sort((a, b) => String(b.dataCriacao).localeCompare(String(a.dataCriacao)));
  }

  /** Avisos destinados às turmas dos filhos do responsável logado. */
  async meus(user: UsuarioLogado) {
    const filhos = await this.acesso.filhosDoResponsavel(user.email);
    if (filhos.length === 0) return [];
    const idsFilhos = filhos.map((a) => String(a.id));
    const escolaId = String(filhos[0].escolaId);
    const turmas = (await this.db.list('turmas', { escolaId })).filter((t) =>
      (t.alunos ?? []).some((id: any) => idsFilhos.includes(String(id))),
    );
    const idsTurmas = turmas.map((t) => String(t.id));
    const email = normalizarEmail(user.email);
    return (await this.db.list('avisos', { escolaId }))
      .filter((a) => (a.publico ?? []).some((id: any) => idsTurmas.includes(String(id))))
      .map((a) => ({
        id: a.id,
        tituloAviso: a.tituloAviso,
        descricao: a.descricao,
        tipoAviso: a.tipoAviso,
        dataCriacao: a.dataCriacao,
        nomeRemetente: a.nomeRemetente,
        lido: (a.responsaveisQueLeram ?? []).map(normalizarEmail).includes(email),
      }))
      .sort((a, b) => String(b.dataCriacao).localeCompare(String(a.dataCriacao)));
  }

  /** Confirmação de leitura pelo responsável (RF13). Só altera a lista de leituras. */
  async marcarLido(id: string, user: UsuarioLogado) {
    const meus = await this.meus(user);
    if (!meus.some((a) => String(a.id) === String(id))) {
      throw new ForbiddenException('Este aviso não foi enviado para você.');
    }
    const aviso = await this.db.get('avisos', id, 'Aviso não encontrado.');
    const email = normalizarEmail(user.email);
    const leituras: string[] = (aviso.responsaveisQueLeram ?? []).map(normalizarEmail);
    if (!leituras.includes(email)) {
      await this.db.patch('avisos', id, { responsaveisQueLeram: [...leituras, email] });
    }
    return { id, lido: true };
  }
}
