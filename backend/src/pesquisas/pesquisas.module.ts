import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pesquisa } from './pesquisa.entity';
import { PesquisasController } from './pesquisas.controller';
import { PesquisasService } from './pesquisas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pesquisa])],
  controllers: [PesquisasController],
  providers: [PesquisasService],
  exports: [PesquisasService],
})
export class PesquisasModule {}
