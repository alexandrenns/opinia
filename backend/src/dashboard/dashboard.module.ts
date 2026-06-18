import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Municipio } from '../municipios/municipio.entity';
import { Contratante } from '../contratantes/contratante.entity';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { Token } from '../tokens/token.entity';
import { Resposta } from '../respostas/resposta.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Municipio, Contratante, Pesquisa, Token, Resposta])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
