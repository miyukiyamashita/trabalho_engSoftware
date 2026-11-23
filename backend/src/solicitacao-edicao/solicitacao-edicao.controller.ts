import { Body, Controller, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { SolicitacaoEdicaoService } from './solicitacao-edicao.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { SolicitacaoEdicaoDto, DecisaoDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('solicitacoes-edicao')
export class SolicitacaoEdicaoController {
  constructor(private readonly service: SolicitacaoEdicaoService) {}

  @Post()
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  create(@Body() data: SolicitacaoEdicaoDto, @Usuario() user: UsuarioLogado) {
    return this.service.create(data, user);
  }

  @Get()
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  updateStatus(@Param('id') id: string, @Body() decisao: DecisaoDto) {
    return this.service.decidir(id, decisao.status);
  }
}
