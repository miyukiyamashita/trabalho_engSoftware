import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ProfessoresService } from './professores.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { ProfessorDto, ProfessorUpdateDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Roles(TipoUsuario.ADMIN_ESCOLAR)
@Controller('professores')
export class ProfessoresController {
  constructor(private readonly service: ProfessoresService) {}

  @Get()
  findAll(@Usuario() user: UsuarioLogado) {
    return this.service.findAll(user);
  }

  @Post()
  create(@Body() body: ProfessorDto, @Usuario() user: UsuarioLogado) {
    return this.service.create(body, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: ProfessorUpdateDto, @Usuario() user: UsuarioLogado) {
    return this.service.update(id, body, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Usuario() user: UsuarioLogado) {
    return this.service.remove(id, user);
  }
}
