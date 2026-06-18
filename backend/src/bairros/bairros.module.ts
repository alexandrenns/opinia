import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bairro } from './bairro.entity';
import { BairrosController } from './bairros.controller';
import { BairrosService } from './bairros.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bairro])],
  controllers: [BairrosController],
  providers: [BairrosService],
  exports: [BairrosService],
})
export class BairrosModule {}
