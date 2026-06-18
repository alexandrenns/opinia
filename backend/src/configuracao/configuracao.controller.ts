import { Controller, Get, Put, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfiguracaoService } from './configuracao.service';

@Controller('configuracao')
export class ConfiguracaoController {
  constructor(private service: ConfiguracaoService) {}

  @Get()
  get() { return this.service.get(); }

  @Put()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  async update(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) body.logo = `/uploads/config/${file.filename}`;
    return this.service.update(body);
  }
}
