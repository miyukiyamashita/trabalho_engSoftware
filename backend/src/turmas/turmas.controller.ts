import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { TurmaDto, TurmaUpdateDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly service: TurmasService) {}

  @Get()
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  findAll(@Usuario() user: UsuarioLogado) {
    return this.service.findAll(user);
  }

  @Post()
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  create(@Body() body: TurmaDto, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  findOne(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  update(@Param('id') id: string, @Body() body: TurmaUpdateDto, @Usuario() user: UsuarioLogado) {
    return this.service.update(id, body, user);
  }

  @Delete(':id')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  remove(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.remove(id, user);
  }

  @Patch(':id/remover-aluno')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  removerAluno(@Param('id') id: string, @Body('alunoId') alunoId: string, @Usuario() user: UsuarioLogado) {
    return this.service.removerAluno(id, alunoId, user);
  }

  @Patch(':id/remover-disciplina')
  @Roles(TipoUsuario.ADMIN_ESCOLAR)
  removerDisciplina(
    @Param('id') id: string,
    @Body('disciplinaId') disciplinaId: string,
    @Usuario() user: UsuarioLogado,
  ) {
    return this.service.removerDisciplina(id, disciplinaId, user);
  }
}
