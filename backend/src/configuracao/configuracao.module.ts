import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ConfiguracaoSistema } from './configuracao-sistema.entity';
import { ConfiguracaoController } from './configuracao.controller';
import { ConfiguracaoService } from './configuracao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConfiguracaoSistema]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/config';
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [ConfiguracaoController],
  providers: [ConfiguracaoService],
  exports: [ConfiguracaoService],
})
export class ConfiguracaoModule {}
