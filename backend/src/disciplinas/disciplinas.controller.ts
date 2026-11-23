import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { DisciplinasService } from './disciplinas.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { DisciplinaDto, DisciplinaUpdateDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly service: DisciplinasService) {}

  @Get()
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  findAll(@Usuario() user: UsuarioLogado) {
    return this.service.findAll(user);
  }

  @Post()
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  create(@Body() body: DisciplinaDto, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  findOne(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  update(@Param('id') id: string, @Body() body: DisciplinaUpdateDto, @Usuario() user: UsuarioLogado) {
    return this.service.update(id, body, user);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  remove(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.remove(id, user);
  }
}
