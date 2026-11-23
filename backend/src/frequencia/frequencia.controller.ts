import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FrequenciaService } from './frequencia.service';
import { Usuario, Roles } from '../common/decorators';
import type { UsuarioLogado } from '../common/escopo';
import { FrequenciaDto } from '../common/dtos';
import { TipoUsuario } from '../classes/tipo-usuario';

@Controller('frequencia')
export class FrequenciaController {
  constructor(private readonly service: FrequenciaService) {}

  @Get('buscar')
  @Roles(TipoUsuario.ADMIN_ESCOLAR, TipoUsuario.PROF)
  buscar(
    @Query('turmaId') turmaId: string,
    @Query('disciplinaId') disciplinaId: string,
    @Query('data') data: string,
    @Usuario() user: UsuarioLogado,
  ) {
    return this.service.buscar(turmaId, disciplinaId, data, user);
  }

  @Post('registrar')
  @Roles(TipoUsuario.PROF)
  registrar(@Body() body: FrequenciaDto, @Usuario() user: UsuarioLogado) {
    return this.service.registrar(body, user);
  }
}
