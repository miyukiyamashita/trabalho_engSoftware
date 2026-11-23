import { Controller, Get, Param, Delete, Post, Patch, Body } from '@nestjs/common';
import { EscolasService } from './escolas.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('escolas')
export class EscolasController {
  constructor(private readonly service: EscolasService) {}

  @Get()
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  findAll() {
    return this.service.findAll();
  }

  @Get('minha')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  findMinha(@Usuario() user: UsuarioLogado) {
    return this.service.findMinha(user);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  create(@Body() body: any) {
    return this.service.criarComAdmin(body);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  remove(@Param('id') id: string) {
    return this.service.removerEmCascata(id);
  }
}
