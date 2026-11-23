import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AlunosService } from './alunos.service';
import { Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('alunos')
export class AlunosController {
  constructor(private readonly service: AlunosService) {}

  @Get()
  findAll(@Usuario() user: UsuarioLogado, @Query('turmaId') turmaId?: string) {
    return this.service.findAll(user, turmaId);
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
}
