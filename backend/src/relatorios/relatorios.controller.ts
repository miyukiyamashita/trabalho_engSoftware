import { Controller, Get, Module, Post, Query, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { RelatoriosService } from './relatorios.service';
import { Roles, Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { TipoUsuario } from '../classes/tipo-usuario';
import { PainelModule } from '../painel/painel.controller';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Post('gerar')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  gerar(@Usuario() user: UsuarioLogado) {
    return this.service.gerarParaEscola(user);
  }

  @Get()
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  listar(@Usuario() user: UsuarioLogado) {
    return this.service.listarDaEscola(user);
  }

  @Get('meu')
  @Roles(TipoUsuario.RESPONSAVEL)
  meu(@Usuario() user: UsuarioLogado, @Query('alunoId') alunoId?: string) {
    return this.service.situacaoDoResponsavel(user, alunoId);
  }

  @Get('meu/arquivo')
  @Roles(TipoUsuario.RESPONSAVEL)
  async arquivo(
    @Usuario() user: UsuarioLogado,
    @Res({ passthrough: true }) res: Response,
    @Query('alunoId') alunoId?: string,
  ) {
    const { caminho, nome } = await this.service.arquivoDoResponsavel(user, alunoId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio_final.pdf"; filename*=UTF-8''${encodeURIComponent(nome)}`,
    });
    return new StreamableFile(fs.createReadStream(caminho));
  }
}

@Module({
  imports: [PainelModule],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
