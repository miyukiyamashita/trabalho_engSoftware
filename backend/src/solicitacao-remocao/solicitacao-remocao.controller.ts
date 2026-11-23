import { Body, Controller, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { SolicitacaoRemocaoService } from './solicitacao-remocao.service';
import { Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('solicitacoes-remocao')
export class SolicitacaoRemocaoController {
  constructor(private readonly service: SolicitacaoRemocaoService) {}

  @Post()
  create(@Body() data: any, @Usuario() user: UsuarioLogado) {
    return this.service.create(data, user);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.service.decidir(id, status);
  }
}
