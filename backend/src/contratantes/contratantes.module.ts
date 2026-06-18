import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contratante } from './contratante.entity';
import { ContratantesController } from './contratantes.controller';
import { ContratantesService } from './contratantes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contratante])],
  controllers: [ContratantesController],
  providers: [ContratantesService],
  exports: [ContratantesService],
})
export class ContratantesModule {}
