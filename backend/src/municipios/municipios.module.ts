import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Municipio } from './municipio.entity';
import { MunicipiosController } from './municipios.controller';
import { MunicipiosService } from './municipios.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Module({
  imports: [
    TypeOrmModule.forFeature([Municipio]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = './uploads/brasoes';
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [MunicipiosController],
  providers: [MunicipiosService],
  exports: [MunicipiosService],
})
export class MunicipiosModule {}
