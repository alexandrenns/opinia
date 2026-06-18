import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pergunta } from './pergunta.entity';
import { Alternativa } from './alternativa.entity';
import { PerguntasController } from './perguntas.controller';
import { PerguntasService } from './perguntas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pergunta, Alternativa])],
  controllers: [PerguntasController],
  providers: [PerguntasService],
  exports: [PerguntasService],
})
export class PerguntasModule {}
