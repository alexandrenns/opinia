import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeloOficio } from './modelo-oficio.entity';
import { OficiosController } from './oficios.controller';
import { OficiosService } from './oficios.service';
import { Token } from '../tokens/token.entity';
import { Lote } from '../tokens/lote.entity';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { ConfiguracaoSistema } from '../configuracao/configuracao-sistema.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModeloOficio, Token, Lote, Pesquisa, ConfiguracaoSistema])],
  controllers: [OficiosController],
  providers: [OficiosService],
})
export class OficiosModule {}
