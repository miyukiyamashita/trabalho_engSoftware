import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { NotasService } from './notas.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { LancarNotasDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('notas')
export class NotasController {
  constructor(private readonly service: NotasService) {}

  @Get()
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  findByTurma(
    @Query('turmaId') turmaId: string,
    @Query('disciplinaId') disciplinaId: string | undefined,
    @Usuario() user: UsuarioLogado,
  ) {
    return this.service.findByTurma(turmaId, user, disciplinaId);
  }

  @Post('lancar')
  @Roles(TipoUsuario.PROF)
  lancarNotas(@Body() body: LancarNotasDto, @Usuario() user: UsuarioLogado) {
    return this.service.lancar(body, user);
  }
}
