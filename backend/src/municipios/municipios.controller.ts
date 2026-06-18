import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MunicipiosService } from "./municipios.service";

function parseBoolean(value: any): boolean {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return true;
}

function sanitize(body: any) {
  const data: any = {};
  if (body.nome !== undefined) data.nome = body.nome;
  if (body.estado !== undefined) data.estado = body.estado;
  if (body.populacao !== undefined)
    data.populacao = body.populacao ? Number(body.populacao) : null;
  if (body.ativo !== undefined) data.ativo = parseBoolean(body.ativo);
  if (body.brasao !== undefined) data.brasao = body.brasao;
  return data;
}

@Controller("municipios")
@UseGuards(JwtAuthGuard)
export class MunicipiosController {
  constructor(private service: MunicipiosService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get("fix-booleans")
  fixBooleans() {
    return this.service.fixAtivoBooleans();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor("brasao"))
  create(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    if (file) body.brasao = `/uploads/brasoes/${file.filename}`;
    return this.service.create(sanitize(body));
  }

  @Put(":id")
  @UseInterceptors(FileInterceptor("brasao"))
  update(
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) body.brasao = `/uploads/brasoes/${file.filename}`;
    return this.service.update(id, sanitize(body));
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
