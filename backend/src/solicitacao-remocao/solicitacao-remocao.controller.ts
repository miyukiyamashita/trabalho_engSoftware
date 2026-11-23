import { Body, Controller, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { SolicitacaoRemocaoService } from './solicitacao-remocao.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('solicitacoes-remocao')
export class SolicitacaoRemocaoController {
  constructor(private readonly service: SolicitacaoRemocaoService) {}

  @Post()
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  create(@Body() data: any, @Usuario() user: UsuarioLogado) {
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
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.decidir(id, status);
  }
}
