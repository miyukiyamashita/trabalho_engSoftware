import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { AlunoDto, AlunoUpdateDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('alunos')
export class AlunosController {
  constructor(private readonly service: AlunosService) {}

  @Get()
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF, TipoUsuario.RESPONSAVEL)
  findAll(@Usuario() user: UsuarioLogado, @Query('turmaId') turmaId?: string) {
    return this.service.findAll(user, turmaId);
  }

  @Post()
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  create(@Body() body: AlunoDto, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.RESPONSAVEL)
  findOne(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  update(@Param('id') id: string, @Body() body: AlunoUpdateDto, @Usuario() user: UsuarioLogado) {
    return this.service.update(id, body, user);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  remove(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.remove(id, user);
  }
}
