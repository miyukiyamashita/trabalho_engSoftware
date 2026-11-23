import { Module } from '@nestjs/common';
import { SolicitacaoCadastroController } from './solicitacao-cadastro.controller';
import { SolicitacaoCadastroService } from './solicitacao-cadastro.service';
import { EscolasModule } from '../escolas/escolas.module';

@Module({
  imports: [EscolasModule],
  controllers: [SolicitacaoCadastroController],
  providers: [SolicitacaoCadastroService],
})
export class SolicitacaoCadastroModule {}
