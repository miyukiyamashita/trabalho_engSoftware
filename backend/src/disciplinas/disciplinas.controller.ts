import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { DisciplinasService } from './disciplinas.service';
import { Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('disciplinas')
export class DisciplinasController {
  constructor(private readonly service: DisciplinasService) {}

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
}
