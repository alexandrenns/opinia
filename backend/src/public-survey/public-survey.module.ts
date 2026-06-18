import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicSurveyController } from './public-survey.controller';
import { PublicSurveyService } from './public-survey.service';
import { Token } from '../tokens/token.entity';
import { Lote } from '../tokens/lote.entity';
import { Resposta } from '../respostas/resposta.entity';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { ConfiguracaoSistema } from '../configuracao/configuracao-sistema.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Token, Lote, Resposta, Pesquisa, ConfiguracaoSistema])],
  controllers: [PublicSurveyController],
  providers: [PublicSurveyService],
})
export class PublicSurveyModule {}
