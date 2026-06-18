import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BairrosService } from "./bairros.service";

function parseBoolean(value: any): boolean {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return true;
}

@Controller("bairros")
@UseGuards(JwtAuthGuard)
export class BairrosController {
  constructor(private service: BairrosService) {}

  @Get()
  findAll(@Query("municipioId") municipioId?: string) {
    return this.service.findAll(municipioId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create({ ...body, ativo: parseBoolean(body.ativo) });
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.update(id, {
      ...body,
      ativo: parseBoolean(body.ativo),
    });
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
