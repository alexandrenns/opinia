import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Bairro } from "./bairro.entity";

@Injectable()
export class BairrosService {
  constructor(
    @InjectRepository(Bairro)
    private repo: Repository<Bairro>,
  ) {}

  async findAll(municipioId?: string) {
    try {
      const where: any = {};

      if (municipioId) {
        where.municipioId = municipioId;
      }

      const bairros = await this.repo.find({
        where,
        relations: ["municipio"],
        order: { nome: "ASC" },
      });

      // Filtra bairros nulos para evitar problemas no frontend
      return bairros.filter((b) => b != null);
    } catch (e) {
      if (e instanceof Error) {
        console.error("[BairrosService] findAll error:", e.message);
      } else {
        console.error("[BairrosService] findAll error:", e);
      }

      return [];
    }
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["municipio"],
    });
  }

  create(data: Partial<Bairro>) {
    if (data.ativo === undefined) {
      data.ativo = true;
    }

    return this.repo.save(data);
  }

  async update(id: string, data: Partial<Bairro>) {
    if (data.ativo !== undefined) {
      data.ativo = data.ativo === true || (data.ativo as any) === "true";
    }

    await this.repo.update(id, data);

    return this.findOne(id);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
