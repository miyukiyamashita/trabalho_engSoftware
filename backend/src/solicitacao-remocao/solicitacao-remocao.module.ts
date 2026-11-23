import { Module } from '@nestjs/common';
import { SolicitacaoRemocaoService } from './solicitacao-remocao.service';
import { SolicitacaoRemocaoController } from './solicitacao-remocao.controller';
import { EscolasModule } from '../escolas/escolas.module';

@Module({
  imports: [EscolasModule],
  controllers: [SolicitacaoRemocaoController],
  providers: [SolicitacaoRemocaoService],
})
export class SolicitacaoRemocaoModule {}
