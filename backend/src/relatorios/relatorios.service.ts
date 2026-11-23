import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { DbService } from '../common/db.service';
import { AcessoService } from '../common/acesso.service';
import { BoletimService } from '../painel/boletim.service';
import { UsuarioLogado, escolaDoUsuario } from '../common/escopo';
import { gerarPdfRelatorio } from './relatorio-pdf';

/** RNF05: tamanho máximo de cada relatório final. */
export const TAMANHO_MAXIMO_RELATORIO = 5 * 1024 * 1024;

@Injectable()
export class RelatoriosService {
  private readonly pasta: string;

  constructor(
    private readonly db: DbService,
    private readonly acesso: AcessoService,
    private readonly boletim: BoletimService,
    config: ConfigService,
  ) {
    this.pasta = path.resolve(config.get<string>('RELATORIOS_DIR') ?? 'storage/relatorios');
  }

  /** RF14: gera e disponibiliza os relatórios dos alunos da escola do admin logado. */
  async gerarParaEscola(user: UsuarioLogado) {
    const escolaId = escolaDoUsuario(user);
    fs.mkdirSync(this.pasta, { recursive: true });
    const alunos = await this.db.list('alunos', { escolaId });
    const existentes = await this.db.list('relatorios', { escolaId });
    const disponibilizadoEm = new Date().toISOString();
    let maior = 0;

    for (const aluno of alunos) {
      const boletim = await this.boletim.montar(aluno);
      const pdf = await gerarPdfRelatorio(boletim);
      if (pdf.length > TAMANHO_MAXIMO_RELATORIO) {
        throw new InternalServerErrorException(
          `O relatório de ${aluno.nomeAluno} passou de 5 MB e não foi disponibilizado.`,
        );
      }
      maior = Math.max(maior, pdf.length);
      const arquivo = `relatorio_${aluno.id}.pdf`;
      fs.writeFileSync(path.join(this.pasta, arquivo), pdf);

      const dados = {
        alunoId: String(aluno.id),
        escolaId,
        arquivo,
        tamanhoBytes: pdf.length,
        disponibilizadoEm,
        geradoPor: user.nome ?? user.email,
      };
      const atual = existentes.find((r) => String(r.alunoId) === String(aluno.id));
      if (atual) await this.db.patch('relatorios', atual.id, dados);
      else await this.db.create('relatorios', dados);
    }

    return { total: alunos.length, maiorTamanhoBytes: maior, disponibilizadoEm };
  }

  /** Situação dos relatórios da escola (tela do admin escolar). */
  async listarDaEscola(user: UsuarioLogado) {
    const escolaId = escolaDoUsuario(user);
    const [alunos, relatorios] = await Promise.all([
      this.db.list('alunos', { escolaId }),
      this.db.list('relatorios', { escolaId }),
    ]);
    return alunos.map((a) => {
      const r = relatorios.find((x) => String(x.alunoId) === String(a.id));
      return {
        alunoId: a.id,
        nomeAluno: a.nomeAluno,
        disponibilizadoEm: r?.disponibilizadoEm ?? null,
        tamanhoBytes: r?.tamanhoBytes ?? null,
      };
    });
  }

  private async relatorioDoFilho(user: UsuarioLogado, alunoId?: string) {
    const filhos = await this.acesso.filhosDoResponsavel(user.email);
    const aluno = alunoId ? await this.acesso.garantirAlunoDoResponsavel(user, alunoId) : filhos[0];
    if (!aluno) return { aluno: null, relatorio: null };
    const [relatorio] = await this.db.list('relatorios', { alunoId: String(aluno.id) });
    return { aluno, relatorio: relatorio ?? null };
  }

  /** Situação do relatório do filho do responsável logado. */
  async situacaoDoResponsavel(user: UsuarioLogado, alunoId?: string) {
    const { aluno, relatorio } = await this.relatorioDoFilho(user, alunoId);
    return {
      aluno: aluno ? { id: aluno.id, nomeAluno: aluno.nomeAluno } : null,
      disponivel: Boolean(relatorio),
      disponibilizadoEm: relatorio?.disponibilizadoEm ?? null,
      tamanhoBytes: relatorio?.tamanhoBytes ?? null,
    };
  }

  /** Arquivo do relatório: só o responsável vinculado ao aluno consegue baixar. */
  async arquivoDoResponsavel(user: UsuarioLogado, alunoId?: string) {
    const { aluno, relatorio } = await this.relatorioDoFilho(user, alunoId);
    const caminho = relatorio ? path.join(this.pasta, path.basename(relatorio.arquivo)) : '';
    if (!aluno || !relatorio || !fs.existsSync(caminho)) {
      throw new NotFoundException('Relatório ainda não disponível.');
    }
    return { caminho, nome: `Relatorio_Final_${String(aluno.nomeAluno).replace(/\s+/g, '_')}.pdf` };
  }
}
