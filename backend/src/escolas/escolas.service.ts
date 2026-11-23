import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DbService } from '../common/db.service';
import { AdministradoresEscolaresService } from '../administrador-escolar/administrador-escolar.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { TipoUsuario } from '../classes/tipo-usuario';
import { UsuarioLogado, escolaDoUsuario, somenteDigitos } from '../common/escopo';

/** Campos da escola que podem ser alterados (edição direta e solicitação de edição). */
export const CAMPOS_EDITAVEIS_ESCOLA = [
  'nome',
  'cnpj',
  'endereco',
  'telefone',
  'email',
  'setorEducacional',
  'numeroAlunos',
] as const;

export interface DadosNovaEscola {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email?: string;
  setorEducacional: string;
  numeroAlunos: string;
  nomeRepresentante: string;
  cpfRepresentante?: string;
  emailRepresentante: string;
  cargoRepresentante: string;
}

@Injectable()
export class EscolasService {
  constructor(
    private readonly db: DbService,
    private readonly admins: AdministradoresEscolaresService,
    private readonly usuarios: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  findAll() {
    return this.db.list('escolas');
  }

  findOne(id: string) {
    return this.db.get('escolas', id, 'Escola não encontrada.');
  }

  /** Escola do administrador escolar logado (RF05). */
  findMinha(user: UsuarioLogado) {
    return this.findOne(escolaDoUsuario(user));
  }

  async garantirCnpjLivre(cnpj: string, excetoId?: string) {
    const repetida = (await this.db.list('escolas')).find(
      (e) => somenteDigitos(e.cnpj) === somenteDigitos(cnpj) && String(e.id) !== String(excetoId ?? ''),
    );
    if (repetida) {
      throw new ConflictException({
        message: 'Este CNPJ já está cadastrado.',
        campos: { cnpj: `Este CNPJ já pertence à escola ${repetida.nome}. Confira os números digitados.` },
      });
    }
  }

  /**
   * Cria a escola e o administrador escolar com login.
   * Reaproveitado pela aprovação de solicitação (RF03) e pelo cadastro direto (RF04).
   */
  async criarComAdmin(dados: DadosNovaEscola) {
    await this.garantirCnpjLivre(dados.cnpj);
    await this.usuarios.garantirEmailLivre(dados.emailRepresentante, 'emailRepresentante');

    const escola = await this.db.create('escolas', {
      nome: dados.nome,
      cnpj: dados.cnpj,
      endereco: dados.endereco,
      telefone: dados.telefone,
      email: dados.email ?? null,
      setorEducacional: dados.setorEducacional,
      numeroAlunos: dados.numeroAlunos,
      dataRegistro: new Date().toISOString(),
      alunos: [],
      professores: [],
      disciplinas: [],
      turmas: [],
      avisos: [],
    });

    const admin = await this.admins.create({
      nome: dados.nomeRepresentante,
      email: dados.emailRepresentante,
      cargo: dados.cargoRepresentante,
      cpf: dados.cpfRepresentante,
      escolaId: escola.id,
    });

    return {
      escola,
      administrador: admin.administrador,
      emailEnviado: admin.emailEnviado,
      senhaTemporaria: admin.senhaTemporaria,
    };
  }

  /** Edição direta pelo administrador do sistema (RF04). */
  async update(id: string, dados: Record<string, any>) {
    await this.findOne(id);
    const alteracoes: Record<string, any> = {};
    for (const campo of CAMPOS_EDITAVEIS_ESCOLA) if (dados[campo] !== undefined) alteracoes[campo] = dados[campo];
    if (alteracoes.cnpj) await this.garantirCnpjLivre(alteracoes.cnpj, id);
    return this.db.patch('escolas', id, alteracoes);
  }

  /**
   * Remove a escola e TUDO o que pertence a ela, usando escolaId (T6).
   * Nunca apaga por nome de turma ou código de disciplina.
   */
  async removerEmCascata(id: string) {
    const escola = await this.findOne(id);
    const filtro = { escolaId: String(id) };

    const turmas = await this.db.list('turmas', filtro);
    for (const turma of turmas) {
      for (const n of await this.db.list('notas', { turmaId: String(turma.id) })) await this.db.remove('notas', n.id);
      for (const f of await this.db.list('frequencia', { turmaId: String(turma.id) }))
        await this.db.remove('frequencia', f.id);
      await this.db.remove('turmas', turma.id);
    }

    const pasta = path.resolve(this.config.get<string>('RELATORIOS_DIR') ?? 'storage/relatorios');
    for (const relatorio of await this.db.list('relatorios', filtro)) {
      if (relatorio.arquivo) fs.rmSync(path.join(pasta, path.basename(relatorio.arquivo)), { force: true });
      await this.db.remove('relatorios', relatorio.id);
    }

    for (const colecao of ['disciplinas', 'avisos']) {
      for (const item of await this.db.list(colecao, filtro)) await this.db.remove(colecao, item.id);
    }

    for (const prof of await this.db.list('professores', filtro)) {
      await this.usuarios.removerPorPerfil(TipoUsuario.PROF, prof.id);
      await this.db.remove('professores', prof.id);
    }

    for (const aluno of await this.db.list('alunos', filtro)) await this.db.remove('alunos', aluno.id);
    for (const login of await this.db.list('usuarios', { tipo: TipoUsuario.RESPONSAVEL, escolaId: String(id) })) {
      await this.usuarios.remover(login.id);
    }

    await this.admins.removerDaEscola(String(id));
    await this.db.remove('escolas', id);
    return { message: `Escola ${escola.nome} e todos os seus dados foram removidos.` };
  }
}
