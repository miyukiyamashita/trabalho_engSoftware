import { Body, Controller, Get, Param, Post, Patch, Query } from '@nestjs/common';
import { SolicitacaoCadastroService } from './solicitacao-cadastro.service';
import { Public, Roles } from '../common/decorators';
import { TipoUsuario } from '../classes/tipo-usuario';
import { SolicitacaoCadastroDto, DecisaoDto } from '../common/dtos';

@Controller('solicitacoes-cadastro')
export class SolicitacaoCadastroController {
  constructor(private readonly service: SolicitacaoCadastroService) {}

  @Public()
  @Post()
  create(@Body() data: SolicitacaoCadastroDto) {
    return this.service.create(data);
  }

  @Get()
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Public()
  @Get(':id/status')
  statusPublico(@Param('id') id: string) {
    return this.service.statusPublico(id);
  }

  @Get(':id')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(TipoUsuario.ADMIN_SISTEMA)
  updateStatus(@Param('id') id: string, @Body() decisao: DecisaoDto) {
    return this.service.decidir(id, decisao.status);
  }
}
