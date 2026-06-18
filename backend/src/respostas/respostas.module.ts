import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Resposta } from './resposta.entity';
import { Token } from '../tokens/token.entity';
import { RespostasController } from './respostas.controller';
import { RespostasService } from './respostas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Resposta, Token])],
  controllers: [RespostasController],
  providers: [RespostasService],
  exports: [RespostasService],
})
export class RespostasModule {}
