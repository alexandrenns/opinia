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

// ── PALETA DE CORES ──────────────────────────────────────────────────────────
const NAVY = "#0a2855";
const BLUE = "#1a5cb8";
const RED = "#c0392b";
const WHITE = "#FFFFFF";
const LGRAY = "#f5f7fa";
const DGRAY = "#333333";
const MGRAY = "#666666";
const BGRAY = "#dde3ec";
const LBLUE = "#e8f0fc";

// ── MAPEAMENTO CENTRALIZADO DE ÍCONES POR TEMA ───────────────────────────────
// Para adicionar um novo tema: inclua uma entrada { abbr, color } aqui.
const TOPIC_MAP: Record<string, { abbr: string; color: string }> = {
  Saúde: { abbr: "+", color: "#e74c3c" },
  Saude: { abbr: "+", color: "#e74c3c" },
  Educação: { abbr: "E", color: "#1976d2" },
  Educacao: { abbr: "E", color: "#1976d2" },
  "Segurança Pública": { abbr: "SP", color: "#6a1fa2" },
  "Seguranca Publica": { abbr: "SP", color: "#6a1fa2" },
  Infraestrutura: { abbr: "I", color: "#e67e22" },
  Mobilidade: { abbr: "M", color: "#00897b" },
  Transporte: { abbr: "TR", color: "#00897b" },
  Agricultura: { abbr: "AG", color: "#388e3c" },
  "Assistência Social": { abbr: "AS", color: "#c2185b" },
  "Assistencia Social": { abbr: "AS", color: "#c2185b" },
  Esporte: { abbr: "ES", color: "#f57c00" },
  Cultura: { abbr: "C", color: "#7b1fa2" },
  Turismo: { abbr: "TU", color: "#0288d1" },
  "Meio Ambiente": { abbr: "MA", color: "#2e7d32" },
  Habitação: { abbr: "H", color: "#5d4037" },
  Habitacao: { abbr: "H", color: "#5d4037" },
  "Limpeza Pública": { abbr: "LP", color: "#546e7a" },
  "Limpeza Publica": { abbr: "LP", color: "#546e7a" },
  "Iluminação Pública": { abbr: "IL", color: "#f9a825" },
  "Iluminacao Publica": { abbr: "IL", color: "#f9a825" },
  "Abastecimento de Água": { abbr: "AA", color: "#0288d1" },
  "Abastecimento de Agua": { abbr: "AA", color: "#0288d1" },
  Emprego: { abbr: "EM", color: "#388e3c" },
  Economia: { abbr: "EC", color: "#1565c0" },
  "Administração Pública": { abbr: "AP", color: "#37474f" },
  "Administracao Publica": { abbr: "AP", color: "#37474f" },
  "Avaliação da Gestão": { abbr: "G", color: NAVY },
  "Avaliacao da Gestao": { abbr: "G", color: NAVY },
  Eleitoral: { abbr: "EL", color: NAVY },
  "Pesquisa Eleitoral": { abbr: "EL", color: NAVY },
  "Opinião Pública": { abbr: "OP", color: BLUE },
  "Opiniao Publica": { abbr: "OP", color: BLUE },
  "Pesquisa Política": { abbr: "PP", color: "#4a148c" },
  "Pesquisa Politica": { abbr: "PP", color: "#4a148c" },
  "Pesquisa Institucional": { abbr: "PI", color: NAVY },
  Satisfação: { abbr: "SF", color: "#f57c00" },
  Satisfacao: { abbr: "SF", color: "#f57c00" },
  Temática: { abbr: "TM", color: BLUE },
  Tematica: { abbr: "TM", color: BLUE },
};

function getTopicInfo(tipo: string): { abbr: string; color: string } {
  return TOPIC_MAP[tipo] || { abbr: "★", color: NAVY };
}

// ── HELPERS DE DESENHO ────────────────────────────────────────────────────────

/** Círculo preenchido com letra/abreviação centralizada */
function drawIconCircle(
  doc: any,
  cx: number,
  cy: number,
  r: number,
  bgColor: string,
  label: string,
  fontSize: number,
): void {
  doc.circle(cx, cy, r).fill(bgColor);
  doc
    .fillColor(WHITE)
    .font("Helvetica-Bold")
    .fontSize(fontSize)
    .text(label, cx - r, cy - fontSize / 2 - 1, {
      width: r * 2,
      align: "center",
    });
}

/** Linha tracejada usando segmentos curtos (sem lineDash — compatível com PDFKit 0.x) */
function drawDashedLine(
  doc: any,
  x1: number,
  y: number,
  x2: number,
  color: string,
): void {
  const dash = 4;
  const gap = 4;
  let x = x1;
  while (x < x2) {
    const end = Math.min(x + dash, x2);
    doc.moveTo(x, y).lineTo(end, y).strokeColor(color).lineWidth(0.5).stroke();
    x += dash + gap;
  }
}

// ── SERVICE ───────────────────────────────────────────────────────────────────

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

  // ── CRUD (inalterado) ─────────────────────────────────────────────────────
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

  // ── GERAÇÃO DO PDF DE OFÍCIOS ─────────────────────────────────────────────
  async gerarPdfOficios(pesquisaId: string, modeloId: string): Promise<Buffer> {
    // Busca de dados (lógica original preservada)
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

    // Caminhos de imagens (lógica original preservada)
    const brasaoPath = pesquisa.municipio?.brasao
      ? join(process.cwd(), pesquisa.municipio.brasao)
      : null;
    const brasaoExiste = brasaoPath && existsSync(brasaoPath);

    const prismaLogoPath = join(process.cwd(), "assets", "prisma-logo.png");
    const prismaLogoExiste = existsSync(prismaLogoPath);

    const configLogoPath = config?.logo
      ? join(process.cwd(), config.logo)
      : null;
    const configLogoExiste = configLogoPath && existsSync(configLogoPath);

    const logoPath = prismaLogoExiste
      ? prismaLogoPath
      : configLogoExiste
        ? configLogoPath!
        : null;

    const municipioNome = pesquisa.municipio?.nome || "";
    const municipioEstado = pesquisa.municipio?.estado || "";
    const tema = pesquisa.tipo || pesquisa.nome || "";
    const topicInfo = getTopicInfo(tema);

    // Geração do PDF (lógica de buffer/stream original preservada)
    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: false,
        bufferPages: false,
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      for (let i = 0; i < allTokens.length; i++) {
        const { codigo, bairro } = allTokens[i];
        const url = `${publicUrl}/r/${codigo}`;

        // Uma página por token (lógica original preservada)
        doc.addPage({ size: "A4", margin: 0 });

        // ════════════════════════════════════════════════════
        // 1. CABEÇALHO  (Y: 0 → 112)
        // ════════════════════════════════════════════════════
        doc.rect(0, 0, 595, 112).fill(WHITE);
        doc.rect(0, 0, 5, 112).fill(NAVY); // barra lateral

        if (logoPath) {
          doc.image(logoPath, 18, 16, { width: 78, height: 78 });
        }

        const textX = logoPath ? 108 : 45;

        doc
          .fillColor(NAVY)
          .font("Helvetica-Bold")
          .fontSize(17)
          .text("INSTITUTO PRISMA DA BAHIA", textX, 20, { width: 375 });
        doc
          .fillColor("#4a4a6a")
          .font("Helvetica")
          .fontSize(9.5)
          .text("Pesquisa de Opinião Pública e Afins", textX, 42, {
            width: 375,
          });
        doc
          .fillColor(RED)
          .font("Helvetica-Oblique")
          .fontSize(9)
          .text("Transformando opiniões em conhecimento.", textX, 57, {
            width: 375,
          });
        doc
          .fillColor("#777777")
          .font("Helvetica")
          .fontSize(9)
          .text(
            `${municipioNome}${municipioEstado ? " – " + municipioEstado : ""}`,
            textX,
            72,
            { width: 375 },
          );

        if (brasaoExiste) {
          doc
            .moveTo(496, 14)
            .lineTo(496, 98)
            .strokeColor("#dddddd")
            .lineWidth(1)
            .stroke();
          doc.image(brasaoPath!, 505, 16, { width: 68, height: 68 });
        }

        // ════════════════════════════════════════════════════
        // 2. SEPARADOR  (Y: 112 → 115)
        // ════════════════════════════════════════════════════
        doc.rect(0, 112, 595, 3).fill(NAVY);

        // ════════════════════════════════════════════════════
        // 3. FAIXA DE TÍTULO  (Y: 115 → 188)
        // ════════════════════════════════════════════════════
        doc.rect(0, 115, 595, 73).fill(NAVY);

        // Elementos diagonais decorativos
        doc
          .moveTo(430, 115)
          .lineTo(595, 115)
          .lineTo(595, 180)
          .lineTo(480, 180)
          .closePath()
          .fill(BLUE);
        doc
          .moveTo(530, 115)
          .lineTo(595, 115)
          .lineTo(595, 188)
          .lineTo(567, 188)
          .closePath()
          .fill(RED);

        doc
          .fillColor("#b8cde8")
          .font("Helvetica")
          .fontSize(8.5)
          .text("CONVITE OFICIAL PARA PARTICIPAÇÃO EM", 42, 128, {
            width: 420,
          });
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(17)
          .text("PESQUISA DE OPINIÃO PÚBLICA", 42, 143, { width: 440 });

        // ════════════════════════════════════════════════════
        // 4. CONTEÚDO  (Y: 196 → 646)
        // Coluna esquerda: x=40,  w=252
        // Coluna direita:  x=307, w=248
        // ════════════════════════════════════════════════════
        const LX = 40,
          LW = 252;
        const RX = 307,
          RW = 248;
        const CY = 196;

        // ── Badge do tema ────────────────────────────────────
        doc
          .roundedRect(LX, CY, LW, 32, 5)
          .strokeColor(NAVY)
          .lineWidth(1.5)
          .stroke();
        doc
          .fillColor(NAVY)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text("PESQUISA:", LX + 10, CY + 11);
        const pillX = LX + 82,
          pillW = LW - 92;
        doc.roundedRect(pillX, CY + 4, pillW, 24, 12).fill(RED);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(tema.toUpperCase(), pillX, CY + 11, {
            width: pillW,
            align: "center",
          });

        // ── Texto institucional ──────────────────────────────
        const bodyText =
          modelo.textoInstitucional ||
          `Prezado(a) cidadão(ã),\n\nO Instituto Prisma da Bahia está realizando uma Pesquisa de Opinião Pública com o objetivo de compreender a percepção da população sobre os serviços prestados no município de ${municipioNome}–${municipioEstado}.\n\nSua participação é voluntária, anônima e de grande importância para a produção de informações confiáveis que contribuam para estudos, análises e avaliações da opinião da população.`;

        doc
          .fillColor(DGRAY)
          .font("Helvetica")
          .fontSize(9)
          .text(bodyText, LX, CY + 44, {
            width: LW,
            align: "justify",
            lineGap: 2,
          });

        doc
          .fillColor(DGRAY)
          .font("Helvetica")
          .fontSize(9)
          .text(
            "Sua colaboração fortalece a qualidade das pesquisas e contribui para uma compreensão mais precisa da realidade do município.",
            LX,
            408,
            { width: LW, align: "justify", lineGap: 2 },
          );

        // ── Card de Garantias ────────────────────────────────
        const gY = 430,
          gH = 216;
        doc.rect(LX + 2, gY + 2, LW, gH).fill("#e2e8f0");
        doc.rect(LX, gY, LW, gH).fill(WHITE);
        doc.rect(LX, gY, LW, gH).strokeColor(BGRAY).lineWidth(1).stroke();
        doc.rect(LX, gY, LW, 28).fill(NAVY);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("GARANTIAS AO PARTICIPANTE", LX, gY + 10, {
            width: LW,
            align: "center",
          });

        const guarantees = [
          { text: "Participação voluntária", letter: "P" },
          { text: "Respostas anônimas", letter: "S" },
          { text: "Nenhum CPF ou documento é solicitado", letter: "D" },
          {
            text: "Resultado apresentado apenas de forma coletiva",
            letter: "R",
          },
          { text: "Tempo médio: 2 minutos", letter: "T" },
        ];

        let gy2 = gY + 40;
        for (let gi = 0; gi < guarantees.length; gi++) {
          drawIconCircle(
            doc,
            LX + 18,
            gy2 + 10,
            11,
            LBLUE,
            guarantees[gi].letter,
            7,
          );
          doc
            .fillColor(DGRAY)
            .font("Helvetica")
            .fontSize(8.5)
            .text(guarantees[gi].text, LX + 36, gy2 + 5);
          if (gi < guarantees.length - 1) {
            drawDashedLine(doc, LX + 36, gy2 + 26, LX + LW - 8, "#cccccc");
          }
          gy2 += 37;
        }

        // ── Card QR Code ─────────────────────────────────────
        doc.rect(RX, CY, RW, 300).strokeColor(BGRAY).lineWidth(1).stroke();
        doc.rect(RX, CY, RW, 28).fill(NAVY);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("PARTICIPE DA PESQUISA", RX, CY + 10, {
            width: RW,
            align: "center",
          });

        drawIconCircle(doc, RX + 24, CY + 50, 16, LBLUE, "QR", 7);
        doc
          .fillColor(DGRAY)
          .font("Helvetica")
          .fontSize(8)
          .text(
            "Escaneie o QR Code com\na câmera do seu celular",
            RX + 47,
            CY + 41,
            { width: 196, lineGap: 1 },
          );

        // Moldura do QR com acentos coloridos
        const qrFX = RX + 12,
          qrFY = CY + 76,
          qrSZ = 222;
        doc
          .rect(qrFX - 4, qrFY - 4, qrSZ + 8, qrSZ + 8)
          .strokeColor(BLUE)
          .lineWidth(2.5)
          .stroke();

        const qrR = qrFX + qrSZ + 4,
          qrB = qrFY + qrSZ + 4;
        doc
          .moveTo(qrR, qrB - 45)
          .lineTo(qrR, qrB)
          .strokeColor(RED)
          .lineWidth(4)
          .stroke();
        doc
          .moveTo(qrR - 45, qrB)
          .lineTo(qrR, qrB)
          .strokeColor(RED)
          .lineWidth(4)
          .stroke();
        doc
          .moveTo(qrFX - 4, qrFY - 4)
          .lineTo(qrFX + 40, qrFY - 4)
          .strokeColor(NAVY)
          .lineWidth(4)
          .stroke();
        doc
          .moveTo(qrFX - 4, qrFY - 4)
          .lineTo(qrFX - 4, qrFY + 40)
          .strokeColor(NAVY)
          .lineWidth(4)
          .stroke();

        // Geração do QR Code (lógica original preservada)
        const qrBuffer = await QRCode.toBuffer(url, {
          errorCorrectionLevel: "H",
          width: qrSZ,
          margin: 1,
        });
        doc.image(qrBuffer, qrFX, qrFY, { width: qrSZ });

        // ── Card Código de Acesso ────────────────────────────
        const acY = CY + 307,
          acH = 145;
        doc.rect(RX, acY, RW, acH).strokeColor(BGRAY).lineWidth(1).stroke();
        doc.rect(RX, acY, RW, 38).fill(NAVY);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text("CASO NÃO CONSIGA UTILIZAR", RX, acY + 8, {
            width: RW,
            align: "center",
          });
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .text("O QR CODE", RX, acY + 21, { width: RW, align: "center" });

        doc
          .fillColor(MGRAY)
          .font("Helvetica")
          .fontSize(8)
          .text("Utilize o código de acesso abaixo:", RX, acY + 47, {
            width: RW,
            align: "center",
          });

        doc
          .fillColor(DGRAY)
          .font("Helvetica-Bold")
          .fontSize(30)
          .text(codigo, RX, acY + 60, {
            width: RW,
            align: "center",
            characterSpacing: 5,
          });

        drawIconCircle(doc, RX + 20, acY + 113, 9, LBLUE, "W", 6);
        doc
          .fillColor(MGRAY)
          .font("Helvetica")
          .fontSize(7.5)
          .text("Acesse:", RX + 35, acY + 107);
        doc
          .fillColor(BLUE)
          .font("Helvetica")
          .fontSize(7.5)
          .text(url, RX + 35, acY + 119, { width: RW - 40 });

        // ════════════════════════════════════════════════════
        // 5. BARRA DE INFORMAÇÕES  (Y: 658 → 708)
        // ════════════════════════════════════════════════════
        const ibY = 658,
          ibH = 50;
        doc.rect(40, ibY, 515, ibH).fill(WHITE);
        doc.rect(40, ibY, 515, ibH).strokeColor(BGRAY).lineWidth(1).stroke();

        const infoSecs = [
          {
            label: "LOCAL DA PESQUISA",
            value: bairro,
            iconColor: NAVY,
            iconLetter: "L",
            valueColor: DGRAY,
          },
          {
            label: "TEMA",
            value: tema,
            iconColor: topicInfo.color,
            iconLetter: topicInfo.abbr,
            valueColor: topicInfo.color,
          },
          {
            label: "MUNICÍPIO",
            value: `${municipioNome} – ${municipioEstado}`,
            iconColor: NAVY,
            iconLetter: "M",
            valueColor: DGRAY,
          },
        ];

        const secW = 515 / 3;
        infoSecs.forEach((sec, idx) => {
          const sx = 40 + idx * secW;
          if (idx > 0) {
            doc
              .moveTo(sx, ibY + 8)
              .lineTo(sx, ibY + ibH - 8)
              .strokeColor(BGRAY)
              .lineWidth(1)
              .stroke();
          }
          drawIconCircle(
            doc,
            sx + 22,
            ibY + ibH / 2,
            15,
            sec.iconColor,
            sec.iconLetter,
            7,
          );
          doc
            .fillColor(MGRAY)
            .font("Helvetica")
            .fontSize(6.5)
            .text(sec.label, sx + 44, ibY + 11);
          doc
            .fillColor(sec.valueColor)
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .text(sec.value, sx + 44, ibY + 23, { width: secW - 56 });
        });

        // ════════════════════════════════════════════════════
        // 6. BOX DE PRIVACIDADE  (Y: 715 → 759)
        // ════════════════════════════════════════════════════
        const pvY = 715,
          pvH = 44;
        doc.rect(40, pvY, 515, pvH).fill(LGRAY);
        doc.rect(40, pvY, 515, pvH).strokeColor(BGRAY).lineWidth(0.5).stroke();
        drawIconCircle(doc, 60, pvY + pvH / 2, 14, NAVY, "S", 8);
        doc
          .fillColor(MGRAY)
          .font("Helvetica")
          .fontSize(7)
          .text(
            "Este documento destina-se exclusivamente ao convite para\nparticipação em pesquisa de opinião pública.",
            82,
            pvY + 8,
            { width: 230, lineGap: 1 },
          );
        doc
          .fillColor(NAVY)
          .font("Helvetica")
          .fontSize(7)
          .text(
            "Participação voluntária  •  Respostas anônimas",
            318,
            pvY + 10,
            { width: 230, align: "center" },
          );
        doc
          .fillColor(NAVY)
          .font("Helvetica")
          .fontSize(7)
          .text("Uso exclusivamente estatístico", 318, pvY + 23, {
            width: 230,
            align: "center",
          });

        // ════════════════════════════════════════════════════
        // 7. RODAPÉ INSTITUCIONAL  (Y: 765 → 842)
        // ════════════════════════════════════════════════════
        const ftY = 765;
        doc.rect(0, ftY, 595, 77).fill(NAVY);
        doc.rect(0, ftY, 595, 3).fill(RED);

        const footerCols = [
          { icon: "W", text: "institutoprisma.com.br" },
          { icon: "@", text: "contato@institutoprisma.com.br" },
          { icon: "IG", text: "/institutoprisma" },
        ];
        const ftColW = 595 / 3;
        footerCols.forEach((col, idx) => {
          const fx = idx * ftColW;
          if (idx > 0) {
            doc
              .moveTo(fx, ftY + 15)
              .lineTo(fx, ftY + 62)
              .strokeColor("#ffffff")
              .lineWidth(0.3)
              .stroke();
          }
          drawIconCircle(
            doc,
            fx + ftColW / 2 - 45,
            ftY + 38,
            9,
            BLUE,
            col.icon,
            6,
          );
          doc
            .fillColor(WHITE)
            .font("Helvetica")
            .fontSize(8.5)
            .text(col.text, fx + ftColW / 2 - 28, ftY + 33, { width: 160 });
        });

        doc
          .fillColor(MGRAY)
          .font("Helvetica")
          .fontSize(7)
          .text(`${i + 1} / ${allTokens.length}`, 0, ftY + 63, {
            width: 590,
            align: "right",
          });
      }

      doc.end();
    });
  }

  // ── GERAÇÃO DO PDF DE CONTROLE (inalterado) ───────────────────────────────
  async gerarPdfControle(pesquisaId: string): Promise<Buffer> {
    const PRIMARY = "#0F4C81";

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
