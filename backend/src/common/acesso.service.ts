import { ForbiddenException, Global, Injectable, Module } from '@nestjs/common';
import { DbService } from './db.service';
import { UsuarioLogado, garantirMesmaEscola } from './escopo';
import { TipoUsuario } from '../classes/tipo-usuario';
import { normalizarEmail } from '../usuarios/usuarios.service';

/**
 * Regras de "dono" (RNF02): professor só acessa as suas turmas/disciplinas,
 * responsável só acessa os próprios filhos, admin escolar só a própria escola.
 */
@Injectable()
export class AcessoService {
  constructor(private readonly db: DbService) {}

  disciplinasDoProfessor(professorId: string) {
    return this.db.list('disciplinas', { professorId: String(professorId) });
  }

  async turmasDoProfessor(professorId: string) {
    const ids = (await this.disciplinasDoProfessor(professorId)).map((d) => String(d.id));
    const turmas = await this.db.list('turmas');
    return turmas.filter((t) => (t.disciplinas ?? []).some((d: any) => ids.includes(String(d))));
  }

  async filhosDoResponsavel(email: string) {
    return this.db.list('alunos', { emailResponsavel: normalizarEmail(email) });
  }

  /** Garante que o usuário pode ver/alterar dados da turma (e da disciplina, se informada). */
  async garantirAcessoTurma(user: UsuarioLogado, turmaId: string, disciplinaId?: string) {
    const turma = await this.db.get('turmas', turmaId, 'Turma não encontrada.');
    if (user.tipo === TipoUsuario.ADMIN_ESCOLAR) {
      garantirMesmaEscola(user, turma);
      return turma;
    }
    if (user.tipo === TipoUsuario.PROF) {
      const minhas = (await this.disciplinasDoProfessor(String(user.perfilId))).map((d) => String(d.id));
      const daTurma = (turma.disciplinas ?? []).map(String);
      const permitido = disciplinaId
        ? minhas.includes(String(disciplinaId)) && daTurma.includes(String(disciplinaId))
        : daTurma.some((d: string) => minhas.includes(d));
      if (!permitido) {
        throw new ForbiddenException('Você não leciona nesta turma ou disciplina.');
      }
      return turma;
    }
    throw new ForbiddenException('Seu perfil não pode acessar esta turma.');
  }

  async garantirAlunoDoResponsavel(user: UsuarioLogado, alunoId: string) {
    const filhos = await this.filhosDoResponsavel(user.email);
    const aluno = filhos.find((a) => String(a.id) === String(alunoId));
    if (!aluno) throw new ForbiddenException('Este aluno não está vinculado à sua conta.');
    return aluno;
  }
}

@Global()
@Module({
  providers: [AcessoService],
  exports: [AcessoService],
})
export class AcessoModule {}
