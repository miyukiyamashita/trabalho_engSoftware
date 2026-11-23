import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly service: AvisosService) {}

  @Post()
  create(@Body() body: any, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get()
  findAll(@Usuario() user: UsuarioLogado) {
    return this.service.findAll(user);
  }

  @Patch(':id/leitura')
  marcarLido(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.marcarLido(id, user);
  }
}
