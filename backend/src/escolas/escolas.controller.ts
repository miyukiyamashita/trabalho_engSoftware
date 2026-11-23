import { Controller, Get, Param, Delete, Post, Patch, Body } from '@nestjs/common';
import { EscolasService } from './escolas.service';
import { Usuario } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';

@Controller('escolas')
export class EscolasController {
  constructor(private readonly service: EscolasService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('minha')
  findMinha(@Usuario() user: UsuarioLogado) {
    return this.service.findMinha(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.criarComAdmin(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.removerEmCascata(id);
  }
}
