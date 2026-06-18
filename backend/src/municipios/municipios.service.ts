import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Municipio } from "./municipio.entity";

@Injectable()
export class MunicipiosService {
  constructor(
    @InjectRepository(Municipio)
    private repo: Repository<Municipio>,
  ) {}

  findAll() {
    return this.repo.find({ order: { nome: "ASC" } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ["bairros"] });
  }

  create(data: Partial<Municipio>) {
    // Garante que ativo seja boolean, nunca string
    if (data.ativo === undefined) data.ativo = true;
    return this.repo.save(data);
  }

  async update(id: string, data: Partial<Municipio>) {
    // Garante que ativo seja boolean
    if (data.ativo !== undefined) {
      data.ativo = data.ativo === true || (data.ativo as any) === "true";
    }
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string) {
    const municipio = await this.repo.findOne({
      where: { id },
      relations: ["pesquisas"],
    });
    if (!municipio) throw new NotFoundException("Município não encontrado");
    if (municipio.pesquisas && municipio.pesquisas.length > 0) {
      throw new BadRequestException(
        "Não é possível excluir município com pesquisas vinculadas. Inative-o.",
      );
    }
    return this.repo.delete(id);
  }

  // Corrige municipios salvos com ativo = 'true' (string) em vez de true (boolean)
  async fixAtivoBooleans() {
    await this.repo.query(
      `UPDATE municipios SET ativo = true WHERE ativo::text = 'true'`,
    );
    await this.repo.query(
      `UPDATE municipios SET ativo = false WHERE ativo::text = 'false'`,
    );
    return { fixed: true };
  }
}
