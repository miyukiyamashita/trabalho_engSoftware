import { Module } from '@nestjs/common';
import { EscolasService } from './escolas.service';
import { EscolasController } from './escolas.controller';
import { AdministradoresEscolaresModule } from '../administrador-escolar/administrador-escolar.module';

@Module({
  imports: [AdministradoresEscolaresModule],
  providers: [EscolasService],
  controllers: [EscolasController],
  exports: [EscolasService],
})
export class EscolasModule {}
