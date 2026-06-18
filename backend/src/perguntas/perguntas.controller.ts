import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PerguntasService } from './perguntas.service';

@Controller('perguntas')
@UseGuards(JwtAuthGuard)
export class PerguntasController {
  constructor(private service: PerguntasService) {}

  @Get()
  findByPesquisa(@Query('pesquisaId') pesquisaId: string) {
    return this.service.findByPesquisa(pesquisaId);
  }

  @Post()
  create(@Body() body: any) { return this.service.create(body); }

  @Put('reorder')
  reorder(@Body() body: { pesquisaId: string; ids: string[] }) {
    return this.service.reorder(body.pesquisaId, body.ids);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) { return this.service.duplicate(id); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
