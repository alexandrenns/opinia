import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RelatoriosService } from './relatorios.service';

@Controller('relatorios')
@UseGuards(JwtAuthGuard)
export class RelatoriosController {
  constructor(private service: RelatoriosService) {}

  @Get(':pesquisaId')
  async gerarRelatorio(@Param('pesquisaId') pesquisaId: string, @Res() res: Response) {
    const pdf = await this.service.gerarRelatorio(pesquisaId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-${pesquisaId}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }
}
