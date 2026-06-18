import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OficiosService } from "./oficios.service";

function parseBoolean(value: any): boolean {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return true;
}

@Controller("oficios")
@UseGuards(JwtAuthGuard)
export class OficiosController {
  constructor(private service: OficiosService) {}

  @Get("modelos") findAll() {
    return this.service.findAll();
  }
  @Get("modelos/:id") findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post("modelos")
  create(@Body() body: any) {
    return this.service.create({ ...body, ativo: parseBoolean(body.ativo) });
  }

  @Put("modelos/:id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.update(id, {
      ...body,
      ativo: parseBoolean(body.ativo),
    });
  }

  @Delete("modelos/:id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post("gerar/:pesquisaId/modelo/:modeloId")
  async gerarOficios(
    @Param("pesquisaId") pesquisaId: string,
    @Param("modeloId") modeloId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.service.gerarPdfOficios(pesquisaId, modeloId);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="oficios-${pesquisaId}.pdf"`,
      "Content-Length": pdf.length,
    });
    res.end(pdf);
  }

  @Get("controle/:pesquisaId")
  async gerarControle(
    @Param("pesquisaId") pesquisaId: string,
    @Res() res: Response,
  ) {
    const pdf = await this.service.gerarPdfControle(pesquisaId);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="controle-tokens-${pesquisaId}.pdf"`,
      "Content-Length": pdf.length,
    });
    res.end(pdf);
  }
}
