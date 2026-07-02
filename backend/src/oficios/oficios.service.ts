import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import PDFDocument = require("pdfkit");
import * as QRCode from "qrcode";
import { join } from "path";
import { existsSync } from "fs";
import { ModeloOficio } from "./modelo-oficio.entity";
import { Lote } from "../tokens/lote.entity";
import { Pesquisa } from "../pesquisas/pesquisa.entity";
import { ConfiguracaoSistema } from "../configuracao/configuracao-sistema.entity";

const PRIMARY = "#0F4C81";
const SECONDARY = "#1F6FB2";

// A4 em pontos: 595 x 842
// Com margin 50: área útil Y vai de 0 a 842

@Injectable()
export class OficiosService {
  constructor(
    @InjectRepository(ModeloOficio)
    private modeloRepo: Repository<ModeloOficio>,
    @InjectRepository(Lote) private loteRepo: Repository<Lote>,
    @InjectRepository(Pesquisa) private pesquisaRepo: Repository<Pesquisa>,
    @InjectRepository(ConfiguracaoSistema)
    private configRepo: Repository<ConfiguracaoSistema>,
  ) {}

  findAll() {
    return this.modeloRepo.find({ order: { nome: "ASC" } });
  }
  findOne(id: string) {
    return this.modeloRepo.findOne({ where: { id } });
  }
  create(data: Partial<ModeloOficio>) {
    return this.modeloRepo.save(data);
  }
  async update(id: string, data: Partial<ModeloOficio>) {
    await this.modeloRepo.update(id, data);
    return this.findOne(id);
  }
  remove(id: string) {
    return this.modeloRepo.delete(id);
  }

  async gerarPdfOficios(pesquisaId: string, modeloId: string): Promise<Buffer> {
    const pesquisa = await this.pesquisaRepo.findOne({
      where: { id: pesquisaId },
      relations: ["municipio", "contratante"],
    });
    if (!pesquisa) throw new NotFoundException("Pesquisa não encontrada");

    const modelo = await this.modeloRepo.findOne({ where: { id: modeloId } });
    if (!modelo) throw new NotFoundException("Modelo de ofício não encontrado");

    const config = await this.configRepo.findOne({ where: {} });
    const publicUrl = config?.publicUrl || "http://localhost:4200";

    const lotes = await this.loteRepo.find({
      where: { pesquisaId },
      relations: ["bairro", "tokens"],
    });

    const allTokens: { codigo: string; bairro: string }[] = [];
    for (const lote of lotes) {
      for (const token of lote.tokens) {
        allTokens.push({ codigo: token.codigo, bairro: lote.bairro.nome });
      }
    }

    return new Promise(async (resolve, reject) => {
      // autoFirstPage: false — controlamos a criação de cada página manualmente
      const doc = new PDFDocument({
        size: "A4",
        margin: 0, // sem margin automática — posicionamos tudo manualmente
        autoFirstPage: false,
        bufferPages: false, // NÃO usar bufferPages — causa páginas extras ao numerar
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const brasaoPath = pesquisa.municipio?.brasao
        ? join(process.cwd(), pesquisa.municipio.brasao)
        : null;
      const brasaoExiste = brasaoPath && existsSync(brasaoPath);

      const logoPath = config?.logo ? join(process.cwd(), config.logo) : null;
      const logoExiste = logoPath && existsSync(logoPath);

      for (let i = 0; i < allTokens.length; i++) {
        const { codigo, bairro } = allTokens[i];
        const url = `${publicUrl}/r/${codigo}`;

        // Adiciona nova página — UMA por token
        doc.addPage({ size: "A4", margin: 0 });

        // ── HEADER (Y: 0-100) ────────────────────────────────────────────
        doc.rect(0, 0, 595, 100).fill("#F5F7FA");

        let xText = 70;

        if (brasaoExiste) {
          doc.image(logoPath!, 30, 25, { width: 65, height: 65 });
          xText = 105;
        }

        if (logoExiste) {
          doc.image(brasaoPath!, 505, 25, { width: 60, height: 60 });
        }

        doc
          .fillColor(PRIMARY)
          .font("Helvetica-Bold")
          .fontSize(16)
          .text(config?.nomePlataforma || "Opinia", xText, 32, { width: 390 });

        doc
          .fillColor(SECONDARY)
          .font("Helvetica")
          .fontSize(10)
          .text("Pesquisa de Opinião Pública e Afins", xText, 52, {
            width: 390,
          });

        doc
          .fillColor("#555")
          .fontSize(9)
          .text(
            `${pesquisa.municipio?.nome} — ${pesquisa.municipio?.estado}`,
            xText,
            68,
            { width: 390 },
          );

        // ── DIVISOR ──────────────────────────────────────────────────────
        doc
          .moveTo(40, 108)
          .lineTo(555, 108)
          .strokeColor(PRIMARY)
          .lineWidth(1.5)
          .stroke();

        // ── TÍTULO INSTITUCIONAL (Y: 115-160) ────────────────────────────
        doc
          .fillColor(PRIMARY)
          .font("Helvetica-Bold")
          .fontSize(12)
          .text(
            modelo.cabecalho ||
              "CONVITE PARA PARTICIPAÇÃO EM PESQUISA DE OPINIÃO PÚBLICA",
            40,
            118,
            { align: "center", width: 515 },
          );

        doc
          .fillColor(SECONDARY)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(pesquisa.nome, 40, 142, { align: "center", width: 515 });

        // ── TEXTO INSTITUCIONAL (Y: 162-280) ─────────────────────────────
        const texto =
          modelo.textoInstitucional ||
          `Prezado(a) cidadão(ã),\n\nConvidamos você a participar da pesquisa de opinião pública "${pesquisa.nome}", promovida pelo município de ${pesquisa.municipio?.nome}.\n\nSua participação é voluntária, anônima e de grande importância. Para responder, basta escanear o QR Code abaixo ou digitar o código de acesso.`;

        doc
          .fillColor("#333")
          .font("Helvetica")
          .fontSize(10)
          .text(texto, 40, 162, { align: "justify", width: 515, lineGap: 3 });

        // ── QR CODE (Y: 290-460) ─────────────────────────────────────────
        const qrY = 295;

        // Caixa cinza ao redor do QR
        doc.rect(192, qrY - 8, 210, 210).fill("#F0F4F8");

        const qrBuffer = await QRCode.toBuffer(url, {
          errorCorrectionLevel: "H",
          width: 190,
          margin: 1,
        });

        // QR centralizado: (595 - 190) / 2 = 202
        doc.image(qrBuffer, 202, qrY, { width: 190 });

        // ── TOKEN BOX (Y: 510-560) ────────────────────────────────────────
        const tokenY = qrY + 210 + 5; // ~510

        doc.rect(40, tokenY, 515, 52).fill(PRIMARY);

        doc
          .fillColor("#FFFFFF")
          .font("Helvetica")
          .fontSize(9)
          .text("CÓDIGO DE ACESSO", 40, tokenY + 8, {
            align: "center",
            width: 515,
          });

        doc
          .fillColor("#FFD700")
          .font("Helvetica-Bold")
          .fontSize(26)
          .text(codigo, 40, tokenY + 20, {
            align: "center",
            width: 515,
            characterSpacing: 8,
          });

        // ── URL (Y: ~568) ─────────────────────────────────────────────────
        doc
          .fillColor(SECONDARY)
          .font("Helvetica")
          .fontSize(9)
          .text(`Acesse: ${url}`, 40, tokenY + 58, {
            align: "center",
            width: 515,
          });

        // ── INFO BAIRRO (Y: ~580) ─────────────────────────────────────────
        const infoY = tokenY + 72;
        doc.rect(40, infoY, 515, 22).fill("#EEF2F7");
        doc
          .fillColor("#555")
          .font("Helvetica")
          .fontSize(8)
          .text(
            `Bairro: ${bairro}  |  Pesquisa: ${pesquisa.nome}  |  Município: ${pesquisa.municipio?.nome}`,
            40,
            infoY + 7,
            { align: "center", width: 515 },
          );

        // ── RODAPÉ (Y: 790-820) — dentro dos 842pt da A4 ─────────────────
        doc
          .moveTo(40, 790)
          .lineTo(555, 790)
          .strokeColor("#CCCCCC")
          .lineWidth(0.5)
          .stroke();

        doc
          .fillColor("#999999")
          .font("Helvetica")
          .fontSize(7)
          .text(
            modelo.rodape ||
              config?.rodapePadrao ||
              "Este documento é de uso exclusivo para fins de pesquisa. Participação voluntária e anônima.",
            40,
            796,
            { align: "center", width: 380 },
          );

        // Número da página — à direita, mesma linha
        doc
          .fillColor("#BBBBBB")
          .font("Helvetica")
          .fontSize(7)
          .text(`${i + 1}/${allTokens.length}`, 430, 796, {
            align: "right",
            width: 125,
          });
      }

      doc.end();
    });
  }

  async gerarPdfControle(pesquisaId: string): Promise<Buffer> {
    const pesquisa = await this.pesquisaRepo.findOne({
      where: { id: pesquisaId },
      relations: ["municipio"],
    });
    const lotes = await this.loteRepo.find({
      where: { pesquisaId },
      relations: ["bairro", "tokens", "tokens.resposta"],
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: false,
      });
      const buffers: Buffer[] = [];
      doc.on("data", (c) => buffers.push(c));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      doc.addPage({ size: "A4", margin: 0 });

      // Header
      doc.rect(0, 0, 595, 75).fill(PRIMARY);
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("RELATÓRIO DE CONTROLE DE TOKENS", 40, 15, {
          align: "center",
          width: 515,
        });
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Pesquisa: ${pesquisa?.nome}  |  Município: ${pesquisa?.municipio?.nome}  |  ${new Date().toLocaleString("pt-BR")}`,
          40,
          38,
          { align: "center", width: 515 },
        );

      let y = 85;
      const ROW_H = 20;

      // Cabeçalho da tabela
      doc.rect(40, y, 515, ROW_H).fill("#E8EFF7");
      doc.fillColor(PRIMARY).font("Helvetica-Bold").fontSize(8);
      doc.text("TOKEN", 50, y + 6);
      doc.text("BAIRRO", 130, y + 6);
      doc.text("PESQUISA", 280, y + 6);
      doc.text("STATUS", 470, y + 6);
      y += ROW_H;

      let rowIdx = 0;
      for (const lote of lotes) {
        for (const token of lote.tokens) {
          if (y > 800) {
            doc.addPage({ size: "A4", margin: 0 });
            y = 30;
          }
          const bg = rowIdx % 2 === 0 ? "#FFFFFF" : "#F8F9FB";
          doc.rect(40, y, 515, ROW_H).fill(bg);

          doc
            .fillColor("#333")
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(token.codigo, 50, y + 6);
          doc
            .font("Helvetica")
            .fillColor("#333")
            .text(lote.bairro.nome, 130, y + 6, { width: 145 })
            .text(pesquisa?.nome || "", 280, y + 6, { width: 185 });
          doc
            .fillColor(token.usado ? "#198754" : "#CC8800")
            .font("Helvetica-Bold")
            .text(token.usado ? "RESPONDIDO" : "PENDENTE", 470, y + 6);

          y += ROW_H;
          rowIdx++;
        }
      }

      // Resumo
      const total = lotes.reduce((s, l) => s + l.tokens.length, 0);
      const usados = lotes.reduce(
        (s, l) => s + l.tokens.filter((t: any) => t.usado).length,
        0,
      );
      y += 15;
      if (y > 790) {
        doc.addPage({ size: "A4", margin: 0 });
        y = 30;
      }
      doc.rect(40, y, 515, 40).fill("#F0F4F8");
      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          `Total: ${total}  |  Respondidos: ${usados}  |  Pendentes: ${total - usados}  |  Taxa: ${total > 0 ? Math.round((usados / total) * 100) : 0}%`,
          40,
          y + 14,
          { align: "center", width: 515 },
        );

      doc.end();
    });
  }
}
