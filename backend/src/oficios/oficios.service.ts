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

// ── CORES ────────────────────────────────────────────────────────────────────
const NAVY = "#0a2855";
const BLUE = "#1a5cb8";
const RED = "#c0392b";
const WHITE = "#FFFFFF";
const LGRAY = "#f5f7fa";
const DGRAY = "#333333";
const MGRAY = "#777777";
const BGRAY = "#dde3ec";

// ════════════════════════════════════════════════════════════════════════════
// FUNÇÕES DE ÍCONE
// Cada função desenha um ícone BRANCO sobre um fundo colorido já existente.
// Parâmetros: doc, cx/cy = centro, s = metade do tamanho utilizável, bg = cor do fundo
// ════════════════════════════════════════════════════════════════════════════
type IconFn = (doc: any, cx: number, cy: number, s: number, bg: string) => void;

/** Silhueta de pessoa */
function iconPerson(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  doc.circle(cx, cy - s * 0.26, s * 0.32).fill(WHITE);
  doc
    .moveTo(cx - s * 0.56, cy + s * 0.78)
    .bezierCurveTo(
      cx - s * 0.56,
      cy + s * 0.18,
      cx + s * 0.56,
      cy + s * 0.18,
      cx + s * 0.56,
      cy + s * 0.78,
    )
    .closePath()
    .fill(WHITE);
}

/** Escudo com marca de verificação */
function iconShield(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  bg: string,
): void {
  doc
    .moveTo(cx, cy - s * 0.92)
    .lineTo(cx + s * 0.72, cy - s * 0.32)
    .lineTo(cx + s * 0.72, cy + s * 0.18)
    .bezierCurveTo(
      cx + s * 0.72,
      cy + s * 0.68,
      cx,
      cy + s * 0.96,
      cx,
      cy + s * 0.96,
    )
    .bezierCurveTo(
      cx - s * 0.72,
      cy + s * 0.68,
      cx - s * 0.72,
      cy + s * 0.18,
      cx - s * 0.72,
      cy + s * 0.18,
    )
    .lineTo(cx - s * 0.72, cy - s * 0.32)
    .closePath()
    .fill(WHITE);
  doc
    .moveTo(cx - s * 0.3, cy + s * 0.18)
    .lineTo(cx - s * 0.02, cy + s * 0.48)
    .lineTo(cx + s * 0.4, cy - s * 0.12)
    .strokeColor(bg)
    .lineWidth(s * 0.2)
    .lineJoin("round")
    .lineCap("round")
    .stroke();
}

/** Documento / ficha com linhas */
function iconDocument(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  bg: string,
): void {
  const w = s * 1.06,
    h = s * 1.32;
  doc.roundedRect(cx - w / 2, cy - h / 2, w, h, s * 0.1).fill(WHITE);
  for (let i = 0; i < 3; i++) {
    const lw = i === 2 ? w * 0.54 : w * 0.76;
    const ly = cy - h * 0.16 + i * s * 0.37;
    doc.rect(cx - lw / 2, ly, lw, s * 0.1).fill(bg);
  }
}

/** Gráfico de barras */
function iconChart(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  const bW = s * 0.28,
    base = cy + s * 0.5;
  [
    { ox: -0.53, h: 0.52 },
    { ox: -0.14, h: 0.86 },
    { ox: 0.24, h: 0.65 },
  ].forEach((b) => {
    doc.rect(cx + b.ox * s, base - b.h * s, bW, b.h * s).fill(WHITE);
  });
  doc
    .moveTo(cx - s * 0.65, base + s * 0.04)
    .lineTo(cx + s * 0.65, base + s * 0.04)
    .strokeColor(WHITE)
    .lineWidth(s * 0.1)
    .stroke();
}

/** Relógio */
function iconClock(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  doc
    .circle(cx, cy, s * 0.9)
    .strokeColor(WHITE)
    .lineWidth(s * 0.14)
    .stroke();
  doc
    .moveTo(cx, cy)
    .lineTo(cx - s * 0.3, cy - s * 0.5)
    .strokeColor(WHITE)
    .lineWidth(s * 0.15)
    .lineCap("round")
    .stroke();
  doc
    .moveTo(cx, cy)
    .lineTo(cx + s * 0.52, cy)
    .strokeColor(WHITE)
    .lineWidth(s * 0.12)
    .lineCap("round")
    .stroke();
  doc.circle(cx, cy, s * 0.1).fill(WHITE);
}

/** Alfinete de localização */
function iconPin(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  bg: string,
): void {
  doc.circle(cx, cy - s * 0.22, s * 0.6).fill(WHITE);
  doc
    .moveTo(cx - s * 0.46, cy - s * 0.04)
    .lineTo(cx, cy + s * 0.9)
    .lineTo(cx + s * 0.46, cy - s * 0.04)
    .closePath()
    .fill(WHITE);
  doc.circle(cx, cy - s * 0.22, s * 0.27).fill(bg);
}

/** Coração com linha de pulso */
function iconHeart(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  bg: string,
): void {
  doc
    .moveTo(cx, cy + s * 0.64)
    .bezierCurveTo(
      cx - s * 0.08,
      cy + s * 0.4,
      cx - s,
      cy + s * 0.1,
      cx - s,
      cy - s * 0.28,
    )
    .bezierCurveTo(
      cx - s,
      cy - s * 0.78,
      cx - s * 0.5,
      cy - s,
      cx,
      cy - s * 0.46,
    )
    .bezierCurveTo(
      cx + s * 0.5,
      cy - s,
      cx + s,
      cy - s * 0.78,
      cx + s,
      cy - s * 0.28,
    )
    .bezierCurveTo(
      cx + s,
      cy + s * 0.1,
      cx + s * 0.08,
      cy + s * 0.4,
      cx,
      cy + s * 0.64,
    )
    .closePath()
    .fill(WHITE);
  doc
    .moveTo(cx - s * 0.72, cy + s * 0.06)
    .lineTo(cx - s * 0.36, cy + s * 0.06)
    .lineTo(cx - s * 0.18, cy - s * 0.44)
    .lineTo(cx, cy + s * 0.44)
    .lineTo(cx + s * 0.18, cy + s * 0.06)
    .lineTo(cx + s * 0.72, cy + s * 0.06)
    .strokeColor(bg)
    .lineWidth(s * 0.14)
    .lineJoin("round")
    .lineCap("round")
    .stroke();
}

/** Edifício / prédio governamental */
function iconBuilding(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  bg: string,
): void {
  doc
    .moveTo(cx - s * 0.94, cy - s * 0.06)
    .lineTo(cx, cy - s * 0.84)
    .lineTo(cx + s * 0.94, cy - s * 0.06)
    .closePath()
    .fill(WHITE);
  doc.rect(cx - s * 0.84, cy - s * 0.06, s * 1.68, s * 0.84).fill(WHITE);
  [-0.56, -0.18, 0.18, 0.56].forEach((ox) => {
    doc.rect(cx + ox * s - s * 0.1, cy - s * 0.02, s * 0.18, s * 0.72).fill(bg);
  });
}

/** Cadeado */
function iconLock(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  bg: string,
): void {
  doc
    .roundedRect(cx - s * 0.64, cy - s * 0.06, s * 1.28, s * 0.92, s * 0.14)
    .fill(WHITE);
  doc
    .moveTo(cx - s * 0.36, cy - s * 0.06)
    .lineTo(cx - s * 0.36, cy - s * 0.48)
    .bezierCurveTo(
      cx - s * 0.36,
      cy - s,
      cx + s * 0.36,
      cy - s,
      cx + s * 0.36,
      cy - s * 0.48,
    )
    .lineTo(cx + s * 0.36, cy - s * 0.06)
    .strokeColor(WHITE)
    .lineWidth(s * 0.26)
    .lineJoin("round")
    .stroke();
  doc.circle(cx, cy + s * 0.3, s * 0.2).fill(bg);
}

/** Globo / web */
function iconGlobe(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  doc
    .circle(cx, cy, s * 0.9)
    .strokeColor(WHITE)
    .lineWidth(s * 0.13)
    .stroke();
  doc
    .moveTo(cx - s * 0.9, cy)
    .lineTo(cx + s * 0.9, cy)
    .strokeColor(WHITE)
    .lineWidth(s * 0.1)
    .stroke();
  doc
    .moveTo(cx, cy - s * 0.9)
    .lineTo(cx, cy + s * 0.9)
    .strokeColor(WHITE)
    .lineWidth(s * 0.1)
    .stroke();
  doc
    .moveTo(cx, cy - s * 0.9)
    .bezierCurveTo(
      cx + s * 0.48,
      cy - s * 0.44,
      cx + s * 0.48,
      cy + s * 0.44,
      cx,
      cy + s * 0.9,
    )
    .strokeColor(WHITE)
    .lineWidth(s * 0.1)
    .stroke();
  doc
    .moveTo(cx, cy - s * 0.9)
    .bezierCurveTo(
      cx - s * 0.48,
      cy - s * 0.44,
      cx - s * 0.48,
      cy + s * 0.44,
      cx,
      cy + s * 0.9,
    )
    .strokeColor(WHITE)
    .lineWidth(s * 0.1)
    .stroke();
}

/** Envelope / e-mail */
function iconEnvelope(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  const w = s * 1.66,
    h = s * 1.16;
  doc
    .roundedRect(cx - w / 2, cy - h / 2, w, h, s * 0.1)
    .strokeColor(WHITE)
    .lineWidth(s * 0.12)
    .stroke();
  doc
    .moveTo(cx - w / 2, cy - h / 2)
    .lineTo(cx, cy + s * 0.08)
    .lineTo(cx + w / 2, cy - h / 2)
    .strokeColor(WHITE)
    .lineWidth(s * 0.12)
    .stroke();
}

/** Câmera / Instagram simplificado */
function iconCamera(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  const r = s * 0.88;
  doc
    .roundedRect(cx - r, cy - r * 0.78, r * 2, r * 1.56, r * 0.35)
    .strokeColor(WHITE)
    .lineWidth(s * 0.13)
    .stroke();
  doc
    .circle(cx, cy + r * 0.06, r * 0.52)
    .strokeColor(WHITE)
    .lineWidth(s * 0.12)
    .stroke();
  doc
    .roundedRect(cx + r * 0.35, cy - r * 0.76, r * 0.4, r * 0.3, r * 0.06)
    .fill(WHITE);
}

/** Smartphone (para instrução do QR) */
function iconPhone(
  doc: any,
  cx: number,
  cy: number,
  s: number,
  _bg: string,
): void {
  const w = s * 0.7,
    h = s * 1.18;
  doc
    .roundedRect(cx - w / 2, cy - h / 2, w, h, s * 0.18)
    .strokeColor(WHITE)
    .lineWidth(s * 0.14)
    .stroke();
  doc
    .moveTo(cx - w * 0.3, cy - h / 2 + s * 0.05)
    .lineTo(cx + w * 0.3, cy - h / 2 + s * 0.05)
    .strokeColor(WHITE)
    .lineWidth(s * 0.1)
    .stroke();
  doc.circle(cx, cy + h / 2 - s * 0.14, s * 0.11).fill(WHITE);
}

// ════════════════════════════════════════════════════════════════════════════
// MAPEAMENTO DE TEMAS → cor + ícone
// Para adicionar temas: insira uma entrada aqui.
// ════════════════════════════════════════════════════════════════════════════
interface TopicInfo {
  color: string;
  iconFn: IconFn;
}

const TOPIC_MAP: Record<string, TopicInfo> = {
  Saúde: { color: "#e74c3c", iconFn: iconHeart },
  Saude: { color: "#e74c3c", iconFn: iconHeart },
  Educação: { color: "#1976d2", iconFn: iconDocument },
  Educacao: { color: "#1976d2", iconFn: iconDocument },
  "Segurança Pública": { color: "#6a1fa2", iconFn: iconShield },
  "Seguranca Publica": { color: "#6a1fa2", iconFn: iconShield },
  Infraestrutura: { color: "#e67e22", iconFn: iconBuilding },
  Mobilidade: { color: "#00897b", iconFn: iconChart },
  Transporte: { color: "#00897b", iconFn: iconChart },
  Agricultura: { color: "#388e3c", iconFn: iconHeart },
  "Assistência Social": { color: "#c2185b", iconFn: iconPerson },
  "Assistencia Social": { color: "#c2185b", iconFn: iconPerson },
  Esporte: { color: "#f57c00", iconFn: iconChart },
  Cultura: { color: "#7b1fa2", iconFn: iconBuilding },
  Turismo: { color: "#0288d1", iconFn: iconBuilding },
  "Meio Ambiente": { color: "#2e7d32", iconFn: iconHeart },
  Habitação: { color: "#5d4037", iconFn: iconBuilding },
  Habitacao: { color: "#5d4037", iconFn: iconBuilding },
  "Limpeza Pública": { color: "#546e7a", iconFn: iconChart },
  "Limpeza Publica": { color: "#546e7a", iconFn: iconChart },
  "Iluminação Pública": { color: "#f9a825", iconFn: iconChart },
  "Iluminacao Publica": { color: "#f9a825", iconFn: iconChart },
  "Abastecimento de Água": { color: "#0288d1", iconFn: iconGlobe },
  "Abastecimento de Agua": { color: "#0288d1", iconFn: iconGlobe },
  Emprego: { color: "#388e3c", iconFn: iconPerson },
  Economia: { color: "#1565c0", iconFn: iconChart },
  "Administração Pública": { color: "#37474f", iconFn: iconBuilding },
  "Administracao Publica": { color: "#37474f", iconFn: iconBuilding },
  "Avaliação da Gestão": { color: NAVY, iconFn: iconBuilding },
  "Avaliacao da Gestao": { color: NAVY, iconFn: iconBuilding },
  Eleitoral: { color: NAVY, iconFn: iconBuilding },
  "Pesquisa Eleitoral": { color: NAVY, iconFn: iconBuilding },
  "Opinião Pública": { color: BLUE, iconFn: iconPerson },
  "Opiniao Publica": { color: BLUE, iconFn: iconPerson },
  "Pesquisa Política": { color: "#4a148c", iconFn: iconBuilding },
  "Pesquisa Politica": { color: "#4a148c", iconFn: iconBuilding },
  "Pesquisa Institucional": { color: NAVY, iconFn: iconBuilding },
  Satisfação: { color: "#f57c00", iconFn: iconHeart },
  Satisfacao: { color: "#f57c00", iconFn: iconHeart },
  Temática: { color: BLUE, iconFn: iconChart },
  Tematica: { color: BLUE, iconFn: iconChart },
};

function getTopicInfo(tipo: string): TopicInfo {
  return TOPIC_MAP[tipo] || { color: NAVY, iconFn: iconChart };
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE LAYOUT
// ════════════════════════════════════════════════════════════════════════════

/** Desenha círculo preenchido + chama a função de ícone dentro dele */
function drawCircleIcon(
  doc: any,
  cx: number,
  cy: number,
  r: number,
  bgColor: string,
  iconFn: IconFn,
): void {
  doc.circle(cx, cy, r).fill(bgColor);
  iconFn(doc, cx, cy, r * 0.62, bgColor);
}

/** Linha tracejada por segmentos (compatível com qualquer versão do PDFKit) */
function drawDashedLine(
  doc: any,
  x1: number,
  y: number,
  x2: number,
  color: string,
): void {
  const dash = 4,
    gap = 4;
  let x = x1;
  while (x < x2) {
    doc
      .moveTo(x, y)
      .lineTo(Math.min(x + dash, x2), y)
      .strokeColor(color)
      .lineWidth(0.5)
      .stroke();
    x += dash + gap;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

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

  // ── PDF DE OFÍCIOS ────────────────────────────────────────────────────────
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
    const brasaoExiste = !!(brasaoPath && existsSync(brasaoPath));

    const prismaLogoPath = join(process.cwd(), "assets", "prisma-logo.png");
    const configLogoPath = config?.logo
      ? join(process.cwd(), config.logo)
      : null;
    const logoPath = existsSync(prismaLogoPath)
      ? prismaLogoPath
      : configLogoPath && existsSync(configLogoPath)
        ? configLogoPath
        : null;

    const municipioNome = pesquisa.municipio?.nome || "";
    const municipioEstado = pesquisa.municipio?.estado || "";
    const tema = pesquisa.tipo || pesquisa.nome || "";
    const topicInfo = getTopicInfo(tema);

    return new Promise(async (resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        autoFirstPage: false,
        bufferPages: false,
      });
      const buffers: Buffer[] = [];
      doc.on("data", (c) => buffers.push(c));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      for (let i = 0; i < allTokens.length; i++) {
        const { codigo, bairro } = allTokens[i];
        const url = `${publicUrl}/r/${codigo}`;

        doc.addPage({ size: "A4", margin: 0 });

        // ════════════════════════════════════════════════════
        // 1. CABEÇALHO  (Y: 0 → 112)
        // ════════════════════════════════════════════════════
        doc.rect(0, 0, 595, 112).fill(WHITE);
        doc.rect(0, 0, 5, 112).fill(NAVY); // barra lateral

        if (logoPath) {
          doc.image(logoPath, 14, 15, { width: 78, height: 78 });
        }

        const sepX = 460;
        const textX = logoPath ? 103 : 42;
        const textW = sepX - textX - 10;

        doc
          .fillColor(NAVY)
          .font("Helvetica-Bold")
          .fontSize(16.5)
          .text("INSTITUTO PRISMA DA BAHIA", textX, 20, { width: textW });
        doc
          .fillColor("#4a4a6a")
          .font("Helvetica")
          .fontSize(9.5)
          .text("Pesquisa de Opinião Pública e Afins", textX, 42, {
            width: textW,
          });
        doc
          .fillColor(RED)
          .font("Helvetica-Oblique")
          .fontSize(9)
          .text("Transformando opiniões em conhecimento.", textX, 57, {
            width: textW,
          });
        doc
          .fillColor(MGRAY)
          .font("Helvetica")
          .fontSize(9)
          .text(
            `${municipioNome}${municipioEstado ? " – " + municipioEstado : ""}`,
            textX,
            72,
            { width: textW },
          );

        // Brasão centrado na zona direita
        if (brasaoExiste) {
          doc
            .moveTo(sepX, 14)
            .lineTo(sepX, 98)
            .strokeColor("#e0e0e0")
            .lineWidth(0.8)
            .stroke();
          const bW = 70;
          const bX = sepX + (595 - sepX - bW) / 2;
          const bY = (112 - bW) / 2;
          doc.image(brasaoPath!, bX, bY, { width: bW, height: bW });
        }

        // ════════════════════════════════════════════════════
        // 2. SEPARADOR  (Y: 112)
        // ════════════════════════════════════════════════════
        doc.rect(0, 112, 595, 3).fill(NAVY);

        // ════════════════════════════════════════════════════
        // 3. FAIXA DE TÍTULO  (Y: 115 → 188)
        // ════════════════════════════════════════════════════
        doc.rect(0, 115, 595, 73).fill(NAVY);
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
        //    Coluna esquerda  x=40  w=252
        //    Coluna direita   x=307 w=248
        // ════════════════════════════════════════════════════
        const LX = 40,
          LW = 252;
        const RX = 307,
          RW = 248;
        const CY = 196;

        // ── Badge da pesquisa ─────────────────────────────
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

        // ── Texto institucional ───────────────────────────
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
            406,
            { width: LW, align: "justify", lineGap: 2 },
          );

        // ── Card de Garantias ─────────────────────────────
        const gY = 428,
          gH = 218;
        doc.rect(LX + 2, gY + 2, LW, gH).fill("#e0e6f0");
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

        const guarantees: { text: string; iconFn: IconFn; color: string }[] = [
          { text: "Participação voluntária", iconFn: iconPerson, color: BLUE },
          { text: "Respostas anônimas", iconFn: iconShield, color: BLUE },
          {
            text: "Nenhum CPF ou documento é solicitado",
            iconFn: iconDocument,
            color: BLUE,
          },
          {
            text: "Resultado apresentado apenas de forma coletiva",
            iconFn: iconChart,
            color: BLUE,
          },
          { text: "Tempo médio: 2 minutos", iconFn: iconClock, color: BLUE },
        ];

        let gy2 = gY + 40;
        for (let gi = 0; gi < guarantees.length; gi++) {
          const g = guarantees[gi];
          drawCircleIcon(doc, LX + 18, gy2 + 10, 12, g.color, g.iconFn);
          doc
            .fillColor(DGRAY)
            .font("Helvetica")
            .fontSize(8.5)
            .text(g.text, LX + 36, gy2 + 5);
          if (gi < guarantees.length - 1) {
            drawDashedLine(doc, LX + 36, gy2 + 26, LX + LW - 10, "#cccccc");
          }
          gy2 += 37;
        }

        // ── Card QR Code ──────────────────────────────────
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

        drawCircleIcon(doc, RX + 24, CY + 50, 16, BLUE, iconPhone);
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

        // Moldura do QR
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

        const qrBuffer = await QRCode.toBuffer(url, {
          errorCorrectionLevel: "H",
          width: qrSZ,
          margin: 1,
        });
        doc.image(qrBuffer, qrFX, qrFY, { width: qrSZ });

        // ── Card Código de Acesso ─────────────────────────
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

        drawCircleIcon(doc, RX + 20, acY + 113, 9, BLUE, iconGlobe);
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
            color: NAVY,
            iconFn: iconPin,
            vColor: DGRAY,
          },
          {
            label: "TEMA",
            value: tema,
            color: topicInfo.color,
            iconFn: topicInfo.iconFn,
            vColor: topicInfo.color,
          },
          {
            label: "MUNICÍPIO",
            value: `${municipioNome} – ${municipioEstado}`,
            color: NAVY,
            iconFn: iconBuilding,
            vColor: DGRAY,
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
          drawCircleIcon(
            doc,
            sx + 22,
            ibY + ibH / 2,
            15,
            sec.color,
            sec.iconFn,
          );
          doc
            .fillColor(MGRAY)
            .font("Helvetica")
            .fontSize(6.5)
            .text(sec.label, sx + 44, ibY + 11);
          doc
            .fillColor(sec.vColor)
            .font("Helvetica-Bold")
            .fontSize(8.5)
            .text(sec.value, sx + 44, ibY + 23, { width: secW - 54 });
        });

        // ════════════════════════════════════════════════════
        // 6. BOX DE PRIVACIDADE  (Y: 715 → 759)
        // ════════════════════════════════════════════════════
        const pvY = 715,
          pvH = 44;
        doc.rect(40, pvY, 515, pvH).fill(LGRAY);
        doc.rect(40, pvY, 515, pvH).strokeColor(BGRAY).lineWidth(0.5).stroke();
        drawCircleIcon(doc, 60, pvY + pvH / 2, 14, NAVY, iconLock);
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
        // 7. RODAPÉ  (Y: 765 → 842)
        // ════════════════════════════════════════════════════
        const ftY = 765;
        doc.rect(0, ftY, 595, 77).fill(NAVY);
        doc.rect(0, ftY, 595, 3).fill(RED);

        const footerCols: { iconFn: IconFn; text: string }[] = [
          { iconFn: iconGlobe, text: "institutoprisma.com.br" },
          { iconFn: iconEnvelope, text: "contato@institutoprisma.com.br" },
          { iconFn: iconCamera, text: "/institutoprisma" },
        ];
        const ftColW = 595 / 3;
        footerCols.forEach((col, idx) => {
          const fx = idx * ftColW;
          if (idx > 0) {
            doc
              .moveTo(fx, ftY + 14)
              .lineTo(fx, ftY + 62)
              .strokeColor("#2a5080")
              .lineWidth(1)
              .stroke();
          }
          drawCircleIcon(
            doc,
            fx + ftColW / 2 - 48,
            ftY + 38,
            10,
            BLUE,
            col.iconFn,
          );
          doc
            .fillColor(WHITE)
            .font("Helvetica")
            .fontSize(8.5)
            .text(col.text, fx + ftColW / 2 - 32, ftY + 32, { width: 155 });
        });

        doc
          .fillColor("#5a8ab8")
          .font("Helvetica")
          .fontSize(7)
          .text(`${i + 1} / ${allTokens.length}`, 0, ftY + 63, {
            width: 588,
            align: "right",
          });
      }

      doc.end();
    });
  }

  // ── PDF DE CONTROLE (inalterado) ──────────────────────────────────────────
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
        .fillColor(WHITE)
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
          doc
            .rect(40, y, 515, ROW_H)
            .fill(rowIdx % 2 === 0 ? WHITE : "#F8F9FB");
          doc
            .fillColor("#333")
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(token.codigo, 50, y + 6);
          doc
            .font("Helvetica")
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
