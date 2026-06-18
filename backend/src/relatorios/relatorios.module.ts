import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelatoriosController } from './relatorios.controller';
import { RelatoriosService } from './relatorios.service';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { Resposta } from '../respostas/resposta.entity';
import { Token } from '../tokens/token.entity';
import { Lote } from '../tokens/lote.entity';
import { Pergunta } from '../perguntas/pergunta.entity';
import { Alternativa } from '../perguntas/alternativa.entity';
import { Bairro } from '../bairros/bairro.entity';
import { ConfiguracaoSistema } from '../configuracao/configuracao-sistema.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pesquisa, Resposta, Token, Lote, Pergunta, Alternativa, Bairro, ConfiguracaoSistema])],
  controllers: [RelatoriosController],
  providers: [RelatoriosService],
})
export class RelatoriosModule {}
