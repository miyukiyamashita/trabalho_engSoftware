import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { TipoUsuario } from '../classes/tipo-usuario';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AvisosService } from '../avisos/avisos.service';
import { BoletimService } from './boletim.service';

@Injectable()
export class PainelService {
  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
    private readonly usuarios: UsuariosService,
    private readonly avisos: AvisosService,
    private readonly boletim: BoletimService,
  ) {}

  /** Contadores do dashboard de cada perfil (substitui as leituras diretas do json-server, T1). */
  async dashboard(user: UsuarioLogado) {
    if (user.tipo === TipoUsuario.ADMIN_SISTEMA) {
      const [escolas, cad, edi, rem] = await Promise.all([
        this.db.list('escolas'),
        this.db.list('solicitacoesCadastro', { status: 'PENDENTE' }),
        this.db.list('solicitacoesEdicao', { status: 'PENDENTE' }),
        this.db.list('solicitacoesRemocao', { status: 'PENDENTE' }),
      ]);
      return {
        escolas: escolas.length,
        usuarios: await this.usuarios.contar(),
        solicitacoesPendentes: cad.length + edi.length + rem.length,
      };
    }
    if (user.tipo === TipoUsuario.ADMIN_ESCOLAR) {
      const filtro = { escolaId: String(user.escolaId) };
      const [professores, alunos, turmas, disciplinas, avisos] = await Promise.all(
        ['professores', 'alunos', 'turmas', 'disciplinas', 'avisos'].map((c) => this.db.list(c, filtro)),
      );
      return {
        professores: professores.length,
        alunos: alunos.length,
        turmas: turmas.length,
        disciplinas: disciplinas.length,
        avisos: avisos.length,
      };
    }
    if (user.tipo === TipoUsuario.PROF) {
      const turmas = await this.acesso.turmasDoProfessor(String(user.perfilId));
      const disciplinas = await this.acesso.disciplinasDoProfessor(String(user.perfilId));
      const alunos = new Set<string>();
      turmas.forEach((t) => (t.alunos ?? []).forEach((a: any) => alunos.add(String(a))));
      return {
        alunos: alunos.size,
        turmas: turmas.length,
        disciplinas: disciplinas.length,
        avisos: (await this.avisos.findAll(user)).length,
      };
    }
    return {};
  }

  /** Painel do responsável: aluno vinculado, boletim, frequência e avisos não lidos. */
  async painelResponsavel(user: UsuarioLogado, alunoId?: string) {
    const filhos = await this.acesso.filhosDoResponsavel(user.email);
    if (filhos.length === 0) return { aluno: null };
    const aluno = alunoId ? await this.acesso.garantirAlunoDoResponsavel(user, alunoId) : filhos[0];
    const boletim = await this.boletim.montar(aluno);
    const avisos = await this.avisos.meus(user);
    return {
      ...boletim,
      responsavel: { nome: user.nome ?? aluno.nomeResponsavel },
      avisos: { naoLidos: avisos.filter((a) => !a.lido).length, ultimos: avisos.slice(0, 2) },
    };
  }
}

@Controller()
export class PainelController {
  constructor(private readonly service: PainelService) {}

  @Get('dashboard')
  @Roles(TipoUsuario.ADMIN_SISTEMA, TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  dashboard(@Usuario() user: UsuarioLogado) {
    return this.service.dashboard(user);
  }

  @Get('responsavel/painel')
  @Roles(TipoUsuario.RESPONSAVEL)
  painel(@Usuario() user: UsuarioLogado, @Query('alunoId') alunoId?: string) {
    return this.service.painelResponsavel(user, alunoId);
  }
}

@Module({
  controllers: [PainelController],
  providers: [PainelService, BoletimService, AvisosService],
  exports: [BoletimService],
})
export class PainelModule {}
