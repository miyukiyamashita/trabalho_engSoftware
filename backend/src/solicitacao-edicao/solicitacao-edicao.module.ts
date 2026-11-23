import { Module } from '@nestjs/common';
import { SolicitacaoEdicaoService } from './solicitacao-edicao.service';
import { SolicitacaoEdicaoController } from './solicitacao-edicao.controller';
import { EscolasModule } from '../escolas/escolas.module';

@Module({
  imports: [EscolasModule],
  controllers: [SolicitacaoEdicaoController],
  providers: [SolicitacaoEdicaoService],
})
export class SolicitacaoEdicaoModule {}
