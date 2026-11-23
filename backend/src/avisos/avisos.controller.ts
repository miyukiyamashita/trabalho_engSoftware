import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { AvisosService } from './avisos.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { AvisoDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly service: AvisosService) {}

  @Post()
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  create(@Body() body: AvisoDto, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get()
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF, TipoUsuario.RESPONSAVEL)
  findAll(@Usuario() user: UsuarioLogado) {
    return this.service.findAll(user);
  }

  @Patch(':id/leitura')
  @Roles(TipoUsuario.RESPONSAVEL)
  marcarLido(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.marcarLido(id, user);
  }
}
