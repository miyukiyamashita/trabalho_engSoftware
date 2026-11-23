import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly service: TurmasService) {}

  @Get()
  findAll(@Usuario() user: UsuarioLogado) {
    return this.service.findAll(user);
  }

  @Post()
  create(@Body() body: any, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Usuario() user: UsuarioLogado) {
    return this.service.update(id, body, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.remove(id, user);
  }

  @Patch(':id/remover-aluno')
  removerAluno(@Param('id') id: string, @Body('alunoId') alunoId: string, @Usuario() user: UsuarioLogado) {
    return this.service.removerAluno(id, alunoId, user);
  }

  @Patch(':id/remover-disciplina')
  removerDisciplina(
    @Param('id') id: string,
    @Body('disciplinaId') disciplinaId: string,
    @Usuario() user: UsuarioLogado,
  ) {
    return this.service.removerDisciplina(id, disciplinaId, user);
  }
}
