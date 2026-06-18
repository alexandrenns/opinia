import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import PDFDocument = require("pdfkit");
import { join } from "path";
import { existsSync } from "fs";
import { Pesquisa } from "../pesquisas/pesquisa.entity";
import { Resposta } from "../respostas/resposta.entity";
import { Lote } from "../tokens/lote.entity";
import { Pergunta } from "../perguntas/pergunta.entity";
import { ConfiguracaoSistema } from "../configuracao/configuracao-sistema.entity";

const PRIMARY = "#0F4C81";
const SECONDARY = "#1F6FB2";
const ACCENT = "#2E8BC0";
const SUCCESS = "#198754";
const WARN = "#FFC107";
const WHITE = "#FFFFFF";

// Formata datas sem perder o dia por fuso horário
function formatDate(d: any): string {
  if (!d) return "N/D";
  // Se já é string tipo '2026-06-10', usa direto sem converter para Date
  const str = typeof d === "string" ? d : d.toISOString();
  const parts = str.substring(0, 10).split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

@Injectable()
export class RelatoriosService {
  constructor(
    @InjectRepository(Pesquisa) private pesquisaRepo: Repository<Pesquisa>,
    @InjectRepository(Resposta) private respostaRepo: Repository<Resposta>,
    @InjectRepository(Lote) private loteRepo: Repository<Lote>,
    @InjectRepository(Pergunta) private perguntaRepo: Repository<Pergunta>,
    @InjectRepository(ConfiguracaoSistema)
    private configRepo: Repository<ConfiguracaoSistema>,
  ) {}

  async gerarRelatorio(pesquisaId: string): Promise<Buffer> {
    const pesquisa = await this.pesquisaRepo.findOne({
      where: { id: pesquisaId },
      relations: ["municipio", "contratante"],
    });
    if (!pesquisa) throw new NotFoundException("Pesquisa não encontrada");

    const perguntas = await this.perguntaRepo.find({
      where: { pesquisaId },
      relations: ["alternativas"],
      order: { ordem: "ASC" },
    });

    const respostas = await this.respostaRepo.find({ where: { pesquisaId } });

    const lotes = await this.loteRepo.find({
      where: { pesquisaId },
      relations: ["bairro", "tokens"],
    });

    const config = await this.configRepo.findOne({ where: {} });

    const totalTokens = lotes.reduce((s, l) => s + l.tokens.length, 0);
    const totalRespostas = respostas.length;
    const taxa =
      totalTokens > 0 ? Math.round((totalRespostas / totalTokens) * 100) : 0;

    // Mapa id → texto das alternativas
    const altMap: Record<string, string> = {};
    for (const p of perguntas) {
      for (const a of p.alternativas || []) {
        altMap[a.id] = a.texto;
      }
    }

    const analytics = this.computeAnalytics(perguntas, respostas, altMap);

    const bairroMap: Record<
      string,
      { nome: string; tokens: number; respostas: number }
    > = {};
    for (const lote of lotes) {
      if (!bairroMap[lote.bairroId]) {
        bairroMap[lote.bairroId] = {
          nome: lote.bairro.nome,
          tokens: 0,
          respostas: 0,
        };
      }
      bairroMap[lote.bairroId].tokens += lote.tokens.length;
      bairroMap[lote.bairroId].respostas += lote.tokens.filter(
        (t) => t.usado,
      ).length;
    }

    const indice = this.calcularIndiceMunicipal(analytics, perguntas);

    // Ranking: perguntas de escolha com contagens, ordenadas pela alternativa mais votada
    const ranking = perguntas
      .filter((p) =>
        ["escolha_unica", "multipla_escolha", "condicional"].includes(p.tipo),
      )
      .map((p) => {
        const data = analytics[p.id];
        const top = Object.entries(data?.counts || {})
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3);
        return { pergunta: p.texto, top, total: data?.total || 0 };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);

    return new Promise((resolve, reject) => {
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

      const brasaoPath = pesquisa.municipio?.brasao
        ? join(process.cwd(), pesquisa.municipio.brasao)
        : null;
      const brasaoOk = brasaoPath && existsSync(brasaoPath);
      const logoPath = config?.logo ? join(process.cwd(), config.logo) : null;
      const logoOk = logoPath && existsSync(logoPath);

      const hdr = (title: string) =>
        this.drawPageHeader(doc, title, pesquisa.nome, logoPath, logoOk);
      let y = 145;

      // ── CAPA ─────────────────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      doc.rect(0, 0, 595, 842).fill(PRIMARY);
      doc.polygon([0, 550], [595, 400], [595, 842], [0, 842]).fill(SECONDARY);
      doc
        .polygon([0, 650], [595, 500], [595, 842], [0, 842])
        .fill(ACCENT)
        .fillOpacity(0.35);
      doc.fillOpacity(1);

      if (brasaoOk)
        doc.image(brasaoPath!, 247, 55, { width: 100, height: 100 });
      if (logoOk) doc.image(logoPath!, 35, 35, { width: 75, height: 75 });

      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(30)
        .text(config?.nomePlataforma || "OPINIA", 0, 185, {
          align: "center",
          width: 595,
        });
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#A8D4F5")
        .text("RELATÓRIO DE PESQUISA DE OPINIÃO PÚBLICA", 0, 222, {
          align: "center",
          width: 595,
        });
      doc
        .moveTo(150, 258)
        .lineTo(445, 258)
        .strokeColor("#A8D4F5")
        .lineWidth(1)
        .stroke();
      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(pesquisa.nome, 50, 270, {
          align: "center",
          width: 495,
          lineGap: 4,
        });
      doc
        .fillColor("#A8D4F5")
        .font("Helvetica")
        .fontSize(12)
        .text(
          `${pesquisa.municipio?.nome} — ${pesquisa.municipio?.estado}`,
          0,
          312,
          { align: "center", width: 595 },
        );

      [
        { label: "Convites", value: totalTokens.toString(), color: ACCENT },
        {
          label: "Respostas",
          value: totalRespostas.toString(),
          color: SUCCESS,
        },
        { label: "Participação", value: `${taxa}%`, color: WARN },
        {
          label: "Bairros",
          value: Object.keys(bairroMap).length.toString(),
          color: "#9C27B0",
        },
      ].forEach((box, i) => {
        const x = 50 + i * 125;
        doc.rect(x, 375, 110, 68).fill(box.color).fillOpacity(0.88);
        doc
          .fillOpacity(1)
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(22)
          .text(box.value, x, 383, { width: 110, align: "center" });
        doc
          .font("Helvetica")
          .fontSize(9)
          .text(box.label, x, 413, { width: 110, align: "center" });
      });

      doc
        .fillColor("#D0E8FF")
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Período: ${formatDate(pesquisa.dataInicial)} a ${formatDate(pesquisa.dataFinal)}`,
          0,
          468,
          { align: "center", width: 595 },
        )
        .text(`Contratante: ${pesquisa.contratante?.nome || "N/D"}`, 0, 484, {
          align: "center",
          width: 595,
        });
      doc
        .fillColor("#A8D4F5")
        .fontSize(8)
        .text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 0, 760, {
          align: "center",
          width: 595,
        });

      // ── SUMÁRIO ──────────────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("SUMÁRIO");
      const sections = [
        "1. Metodologia",
        "2. Participação e Distribuição",
        "3. Perfil da Amostra",
        "4. Resultados Gerais",
        "5. Resultados por Bairro",
        "6. Módulo Eleitoral",
        "7. Ranking de Problemas",
        "8. Índice Municipal",
        "9. Conclusão",
      ];
      let sy = 145;
      sections.forEach((s, i) => {
        doc.rect(50, sy, 495, 26).fill(i % 2 === 0 ? "#F0F4F8" : WHITE);
        doc
          .fillColor(PRIMARY)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(s, 65, sy + 7);
        doc
          .fillColor("#999")
          .font("Helvetica")
          .fontSize(9)
          .text(`Pág. ${i + 3}`, 50, sy + 8, { align: "right", width: 495 });
        sy += 26;
      });

      // ── METODOLOGIA ──────────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("1. METODOLOGIA");
      y = 145;
      y = this.drawSection(doc, "Descrição da Pesquisa", y);
      y = this.drawTextBlock(
        doc,
        [
          ["Pesquisa:", pesquisa.nome],
          ["Tipo:", pesquisa.tipo],
          [
            "Município:",
            `${pesquisa.municipio?.nome} — ${pesquisa.municipio?.estado}`,
          ],
          [
            "Contratante:",
            `${pesquisa.contratante?.nome} (${pesquisa.contratante?.tipo || ""})`,
          ],
          [
            "Período:",
            `${formatDate(pesquisa.dataInicial)} a ${formatDate(pesquisa.dataFinal)}`,
          ],
          ["Status:", pesquisa.status],
        ],
        y + 8,
      );
      y += 16;
      y = this.drawSection(doc, "Método de Coleta", y);
      doc
        .fillColor("#444")
        .font("Helvetica")
        .fontSize(10)
        .text(
          "A pesquisa foi realizada por meio de questionário eletrônico distribuído via QR Code impresso em ofícios institucionais, com distribuição física por bairros. Cada entrevistado recebeu um token único para acesso ao formulário online. O método garante anonimato completo do respondente, preservando apenas o registro do bairro de origem para fins de análise geográfica.",
          50,
          y + 10,
          { width: 495, align: "justify", lineGap: 3 },
        );
      y += 85;
      y = this.drawSection(doc, "Amostragem por Bairro", y);
      y += 8;
      doc.rect(50, y, 495, 22).fill(PRIMARY);
      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("BAIRRO", 60, y + 6)
        .text("CONVITES", 270, y + 6)
        .text("RESPOSTAS", 360, y + 6)
        .text("TAXA", 460, y + 6);
      y += 22;
      Object.values(bairroMap).forEach((b, i) => {
        const tb =
          b.tokens > 0 ? Math.round((b.respostas / b.tokens) * 100) : 0;
        doc.rect(50, y, 495, 22).fill(i % 2 === 0 ? "#F5F7FA" : WHITE);
        doc
          .fillColor("#333")
          .font("Helvetica")
          .fontSize(9)
          .text(b.nome, 60, y + 6)
          .text(b.tokens.toString(), 270, y + 6)
          .text(b.respostas.toString(), 360, y + 6);
        doc
          .fillColor(tb >= 50 ? SUCCESS : WARN)
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(`${tb}%`, 460, y + 6);
        y += 22;
      });

      // ── PARTICIPAÇÃO ─────────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("2. PARTICIPAÇÃO E DISTRIBUIÇÃO");
      y = 145;
      [
        {
          label: "Convites Distribuídos",
          value: totalTokens.toString(),
          color: SECONDARY,
        },
        {
          label: "Respostas Recebidas",
          value: totalRespostas.toString(),
          color: SUCCESS,
        },
        {
          label: "Taxa de Participação",
          value: `${taxa}%`,
          color: taxa >= 50 ? SUCCESS : WARN,
        },
      ].forEach((s, i) => {
        const x = 50 + i * 168;
        doc.rect(x, y, 155, 85).fill(s.color);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(30)
          .text(s.value, x, y + 14, { width: 155, align: "center" });
        doc
          .font("Helvetica")
          .fontSize(9)
          .text(s.label, x, y + 54, { width: 155, align: "center" });
      });
      y += 105;
      y = this.drawSection(doc, "Participação por Bairro", y);
      y += 8;
      const maxVal = Math.max(
        ...Object.values(bairroMap).map((b) => b.tokens),
        1,
      );
      Object.values(bairroMap).forEach((b) => {
        const pctBar = b.tokens / maxVal;
        const pctResp = b.tokens > 0 ? b.respostas / b.tokens : 0;
        doc
          .fillColor("#555")
          .font("Helvetica")
          .fontSize(9)
          .text(b.nome, 50, y + 3, { width: 120 });
        doc.rect(178, y, 350 * pctBar, 18).fill("#D0E4F7");
        doc.rect(178, y, 350 * pctBar * pctResp, 18).fill(SECONDARY);
        doc
          .fillColor("#555")
          .fontSize(8)
          .text(`${b.respostas}/${b.tokens}`, 535, y + 4);
        y += 24;
      });

      // ── PERFIL DA AMOSTRA ─────────────────────────────────────────────────
      // Layout fixo dentro de 50..545 (margem segura de 50px cada lado)
      // Colunas: nome(50-195=145px) | barra(200-430=230px) | pct(435-475=40px) | qtd(480-545=65px)
      doc.addPage({ size: "A4", margin: 0 });
      hdr("3. PERFIL DA AMOSTRA");
      y = 145;
      y = this.drawSection(doc, "Distribuição por Bairro", y);
      y += 10;

      // Cabeçalho da tabela de bairros
      doc.rect(50, y, 495, 20).fill(PRIMARY);
      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("BAIRRO", 58, y + 6, { width: 142 })
        .text("PARTICIPAÇÃO", 200, y + 6, { width: 230, align: "center" })
        .text("%", 435, y + 6, { width: 40, align: "center" })
        .text("RESPOSTAS", 480, y + 6, { width: 65, align: "center" });
      y += 20;

      const totalResp =
        Object.values(bairroMap).reduce((s, b) => s + b.respostas, 0) || 1;
      Object.values(bairroMap).forEach((b, i) => {
        const pct = b.respostas / totalResp;
        const barMax = 230; // largura máxima da barra
        const barW = Math.round(barMax * pct);
        const pctStr = `${Math.round(pct * 100)}%`;

        doc.rect(50, y, 495, 26).fill(i % 2 === 0 ? "#F5F7FA" : WHITE);

        // Nome do bairro — col 58-195 (137px), centralizado verticalmente
        doc
          .fillColor("#333")
          .font("Helvetica")
          .fontSize(9)
          .text(b.nome, 58, y + 8, { width: 137, ellipsis: true });

        // Barra de progresso — col 200-430 (230px)
        doc.rect(200, y + 4, barMax, 18).fill("#E2E8F0");
        if (barW > 0) doc.rect(200, y + 4, barW, 18).fill(ACCENT);

        // % dentro da barra (só se couber, senão fora)
        if (barW > 30) {
          doc
            .fillColor(WHITE)
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(pctStr, 204, y + 8, { width: barW - 4 });
        }

        // % col 435-474
        doc
          .fillColor("#333")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(pctStr, 435, y + 8, { width: 40, align: "center" });

        // Qtd col 480-545
        doc
          .fillColor("#333")
          .font("Helvetica")
          .fontSize(9)
          .text(`${b.respostas}`, 480, y + 8, { width: 65, align: "center" });

        y += 26;
      });

      y += 20;
      y = this.drawSection(doc, "Total de Participantes", y);
      y += 10;
      doc.rect(50, y, 495, 52).fill("#EBF5FB");
      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(30)
        .text(totalRespostas.toString(), 50, y + 7, {
          width: 495,
          align: "center",
        });
      doc
        .fillColor(SECONDARY)
        .font("Helvetica")
        .fontSize(10)
        .text(
          `participante(s) de ${Object.keys(bairroMap).length} bairro(s) — taxa de participação: ${taxa}%`,
          50,
          y + 36,
          { width: 495, align: "center" },
        );
      y += 62;

      // Perguntas cadastradas
      y += 10;
      y = this.drawSection(doc, "Questionário Aplicado", y);
      y += 8;

      // Cabeçalho
      doc.rect(50, y, 495, 20).fill(PRIMARY);
      doc
        .fillColor(WHITE)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("Nº", 58, y + 6, { width: 25 })
        .text("PERGUNTA", 88, y + 6, { width: 320 })
        .text("TIPO", 415, y + 6, { width: 120, align: "right" });
      y += 20;

      const tipoLabel: Record<string, string> = {
        escolha_unica: "Escolha única",
        multipla_escolha: "Múltipla escolha",
        escala: "Escala",
        condicional: "Condicional",
      };

      perguntas.forEach((p, i) => {
        if (y > 750) {
          doc.addPage({ size: "A4", margin: 0 });
          hdr("3. PERFIL DA AMOSTRA (cont.)");
          y = 145;
        }
        doc.rect(50, y, 495, 24).fill(i % 2 === 0 ? "#F5F7FA" : WHITE);

        // Número
        doc
          .fillColor(WHITE)
          .rect(58, y + 4, 20, 16)
          .fill(SECONDARY);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text(`P${i + 1}`, 58, y + 8, { width: 20, align: "center" });

        // Texto da pergunta — máx 320px, não ultrapassa
        doc
          .fillColor("#333")
          .font("Helvetica")
          .fontSize(9)
          .text(p.texto, 84, y + 7, {
            width: 325,
            ellipsis: true,
            lineBreak: false,
          });

        // Tipo — alinhado à direita, dentro da página
        doc
          .fillColor("#666")
          .font("Helvetica")
          .fontSize(8)
          .text(tipoLabel[p.tipo] || p.tipo, 415, y + 8, {
            width: 120,
            align: "right",
          });

        y += 24;
      });

      // ── RESULTADOS GERAIS ─────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("4. RESULTADOS GERAIS");
      y = 145;

      for (const pergunta of perguntas) {
        const data = analytics[pergunta.id];
        if (!data) continue;
        if (y > 700) {
          doc.addPage({ size: "A4", margin: 0 });
          hdr("4. RESULTADOS GERAIS (cont.)");
          y = 145;
        }

        doc.rect(50, y, 495, 28).fill("#E8EFF7");
        doc
          .fillColor(PRIMARY)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(`P${pergunta.ordem + 1}. ${pergunta.texto}`, 58, y + 8, {
            width: 479,
          });
        y += 34;

        if (pergunta.tipo === "escala") {
          const avg = data.media || 0;
          const min = pergunta.escalaMin || 1;
          const max = pergunta.escalaMax || 10;
          const pct = max - min > 0 ? (avg - min) / (max - min) : 0;
          doc
            .fillColor("#555")
            .font("Helvetica")
            .fontSize(9)
            .text(
              `Média: ${avg.toFixed(1)}  |  Respostas: ${data.total}  |  Escala: ${min}-${max}`,
              60,
              y,
            );
          y += 16;
          doc.rect(60, y, 450, 14).fill("#E0E0E0");
          doc
            .rect(60, y, 450 * pct, 14)
            .fill(pct >= 0.7 ? SUCCESS : pct >= 0.4 ? WARN : "#DC3545");
          y += 24;
        } else {
          const sorted = Object.entries(data.counts || {})
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 8);
          sorted.forEach(([label, count]: any) => {
            if (y > 750) {
              doc.addPage({ size: "A4", margin: 0 });
              hdr("4. RESULTADOS GERAIS (cont.)");
              y = 145;
            }
            const pct = data.total > 0 ? count / data.total : 0;
            const barW = Math.round(330 * pct);
            doc.rect(60, y, 330, 18).fill("#F0F4F8");
            doc.rect(60, y, Math.max(barW, 2), 18).fill(ACCENT);
            doc
              .fillColor(WHITE)
              .font("Helvetica-Bold")
              .fontSize(8)
              .text(`${Math.round(pct * 100)}%`, 64, y + 4);
            doc
              .fillColor("#333")
              .font("Helvetica")
              .fontSize(9)
              .text(String(label).substring(0, 50), 398, y + 3, { width: 145 });
            doc
              .fillColor("#666")
              .fontSize(8)
              .text(`(${count})`, 548, y + 3);
            y += 22;
          });
        }
        y += 12;
      }

      // ── RESULTADOS POR BAIRRO ─────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("5. RESULTADOS POR BAIRRO");
      y = 145;

      for (const [bairroId, bInfo] of Object.entries(bairroMap)) {
        if (y > 720) {
          doc.addPage({ size: "A4", margin: 0 });
          hdr("5. RESULTADOS POR BAIRRO (cont.)");
          y = 145;
        }
        doc.rect(50, y, 495, 26).fill(PRIMARY);
        doc
          .fillColor(WHITE)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            `Bairro: ${bInfo.nome}  —  ${bInfo.respostas} resposta(s) de ${bInfo.tokens} convites  (${bInfo.tokens > 0 ? Math.round((bInfo.respostas / bInfo.tokens) * 100) : 0}%)`,
            58,
            y + 8,
            { width: 479 },
          );
        y += 32;

        const analyticsBairro = this.computeAnalytics(
          perguntas,
          respostas.filter((r) => r.bairroId === bairroId),
          altMap,
        );

        for (const pergunta of perguntas) {
          if (y > 740) {
            doc.addPage({ size: "A4", margin: 0 });
            hdr("5. RESULTADOS POR BAIRRO (cont.)");
            y = 145;
          }
          const data = analyticsBairro[pergunta.id];
          if (!data || data.total === 0) continue;

          doc
            .fillColor(SECONDARY)
            .font("Helvetica-Bold")
            .fontSize(9)
            .text(
              `P${pergunta.ordem + 1}. ${pergunta.texto.substring(0, 80)}`,
              60,
              y,
            );
          y += 14;

          if (pergunta.tipo === "escala") {
            const avg = data.media || 0;
            doc
              .fillColor("#555")
              .font("Helvetica")
              .fontSize(9)
              .text(`Média: ${avg.toFixed(1)}`, 70, y);
            y += 16;
          } else {
            Object.entries(data.counts || {})
              .sort(([, a]: any, [, b]: any) => b - a)
              .slice(0, 4)
              .forEach(([label, count]: any) => {
                const pct = data.total > 0 ? count / data.total : 0;
                doc.rect(70, y, 260, 14).fill("#F0F4F8");
                doc.rect(70, y, 260 * pct, 14).fill(ACCENT);
                doc
                  .fillColor("#333")
                  .font("Helvetica")
                  .fontSize(8)
                  .text(
                    `${String(label).substring(0, 40)} — ${Math.round(pct * 100)}% (${count})`,
                    338,
                    y + 2,
                    { width: 205 },
                  );
                y += 17;
              });
          }
          y += 6;
        }
        y += 10;
      }

      // ── RANKING DE PROBLEMAS ──────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("7. RANKING DE PROBLEMAS");
      y = 145;
      y = this.drawSection(doc, "Principais Demandas Identificadas", y);
      y += 10;

      doc
        .fillColor("#555")
        .font("Helvetica")
        .fontSize(10)
        .text(
          "As questões abaixo foram identificadas como mais relevantes com base no volume de respostas coletadas, ordenadas por representatividade.",
          50,
          y,
          { width: 495, align: "justify", lineGap: 2 },
        );
      y += 44;

      if (ranking.length === 0) {
        doc
          .fillColor("#999")
          .font("Helvetica")
          .fontSize(11)
          .text(
            "Nenhum dado de ranking disponível para esta pesquisa.",
            50,
            y,
            { width: 495, align: "center" },
          );
      } else {
        ranking.forEach((item, idx) => {
          if (y > 710) {
            doc.addPage({ size: "A4", margin: 0 });
            hdr("7. RANKING DE PROBLEMAS (cont.)");
            y = 145;
          }

          // Posição
          const posColor =
            idx === 0
              ? "#FFD700"
              : idx === 1
                ? "#C0C0C0"
                : idx === 2
                  ? "#CD7F32"
                  : SECONDARY;
          doc.rect(50, y, 30, 30).fill(posColor);
          doc
            .fillColor(WHITE)
            .font("Helvetica-Bold")
            .fontSize(14)
            .text(`${idx + 1}`, 50, y + 6, { width: 30, align: "center" });

          doc
            .fillColor(PRIMARY)
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(item.pergunta.substring(0, 80), 90, y + 2, { width: 455 });
          doc
            .fillColor("#666")
            .font("Helvetica")
            .fontSize(9)
            .text(`${item.total} resposta(s)`, 90, y + 16, { width: 200 });
          y += 36;

          // Top alternativas
          item.top.forEach(([label, count]: any) => {
            if (y > 750) {
              doc.addPage({ size: "A4", margin: 0 });
              hdr("7. RANKING DE PROBLEMAS (cont.)");
              y = 145;
            }
            const pct = item.total > 0 ? count / item.total : 0;
            const barW = Math.round(350 * pct);
            doc.rect(90, y, 350, 16).fill("#F0F4F8");
            doc.rect(90, y, Math.max(barW, 2), 16).fill(ACCENT);
            doc
              .fillColor(WHITE)
              .font("Helvetica-Bold")
              .fontSize(8)
              .text(`${Math.round(pct * 100)}%`, 94, y + 3);
            doc
              .fillColor("#333")
              .font("Helvetica")
              .fontSize(9)
              .text(String(label).substring(0, 45), 450, y + 2, { width: 140 });
            doc
              .fillColor("#888")
              .fontSize(8)
              .text(`(${count})`, 550, y + 2);
            y += 19;
          });
          y += 14;
        });
      }

      // ── ÍNDICE MUNICIPAL ──────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("8. ÍNDICE MUNICIPAL");
      y = 160;
      const indiceColor =
        indice >= 70 ? SUCCESS : indice >= 40 ? WARN : "#DC3545";
      const indiceLabel =
        indice >= 70 ? "BOM" : indice >= 40 ? "REGULAR" : "CRÍTICO";

      doc.rect(197, y, 200, 195).fill("#F0F4F8");
      doc
        .fillColor(indiceColor)
        .font("Helvetica-Bold")
        .fontSize(64)
        .text(indice.toString(), 197, y + 48, { width: 200, align: "center" });
      doc
        .fillColor("#555")
        .font("Helvetica")
        .fontSize(12)
        .text("de 100 pontos", 197, y + 122, { width: 200, align: "center" });
      doc
        .fillColor(indiceColor)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(indiceLabel, 197, y + 148, { width: 200, align: "center" });

      doc
        .fillColor("#444")
        .font("Helvetica")
        .fontSize(10)
        .text(
          "O Índice Municipal é calculado com base nas avaliações coletadas na pesquisa. Considera as respostas de escala e aprovação ponderadas pelo volume de participação por bairro.",
          50,
          y + 210,
          { width: 495, align: "justify" },
        );

      // ── CONCLUSÃO ─────────────────────────────────────────────────────────
      doc.addPage({ size: "A4", margin: 0 });
      hdr("9. CONCLUSÃO");
      y = 145;

      doc
        .fillColor("#333")
        .font("Helvetica")
        .fontSize(11)
        .text(
          this.gerarConclusaoAutomatica(
            pesquisa,
            totalTokens,
            totalRespostas,
            taxa,
            indice,
            bairroMap,
            ranking,
          ),
          50,
          y,
          { width: 495, align: "justify", lineGap: 5 },
        );

      // Rodapé fixo
      doc
        .moveTo(50, 768)
        .lineTo(545, 768)
        .strokeColor("#CCC")
        .lineWidth(0.5)
        .stroke();
      doc
        .fillColor("#999")
        .font("Helvetica")
        .fontSize(8)
        .text(
          `Relatório gerado automaticamente pela plataforma ${config?.nomePlataforma || "Opinia"} em ${new Date().toLocaleString("pt-BR")}`,
          50,
          774,
          { align: "center", width: 495 },
        )
        .text(
          config?.rodapePadrao ||
            "Documento confidencial. Uso restrito ao contratante.",
          50,
          786,
          { align: "center", width: 495 },
        );

      doc.end();
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private drawPageHeader(
    doc: any,
    title: string,
    pesquisaNome: string,
    logoPath: string | null,
    logoOk: boolean,
  ) {
    doc.rect(0, 0, 595, 96).fill(PRIMARY);
    if (logoOk && logoPath)
      doc.image(logoPath, 18, 14, { width: 62, height: 62 });
    doc
      .fillColor(WHITE)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(title, 88, 20, { width: 490 });
    doc
      .fillColor("#A8D4F5")
      .font("Helvetica")
      .fontSize(9)
      .text(pesquisaNome, 88, 42, { width: 490 });
    doc
      .fillColor("#A8D4F5")
      .fontSize(8)
      .text(new Date().toLocaleDateString("pt-BR"), 88, 56, { width: 490 });
  }

  private drawSection(doc: any, title: string, y: number): number {
    doc.rect(50, y, 495, 24).fill(SECONDARY);
    doc
      .fillColor(WHITE)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(title, 60, y + 6);
    return y + 28;
  }

  private drawTextBlock(doc: any, rows: [string, string][], y: number): number {
    rows.forEach(([label, value], i) => {
      doc.rect(50, y, 495, 22).fill(i % 2 === 0 ? "#F5F7FA" : WHITE);
      doc
        .fillColor(PRIMARY)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(label, 60, y + 6, { width: 140 });
      doc
        .fillColor("#333")
        .font("Helvetica")
        .fontSize(9)
        .text(value, 205, y + 6, { width: 330 });
      y += 22;
    });
    return y;
  }

  private computeAnalytics(
    perguntas: any[],
    respostas: any[],
    altMap: Record<string, string>,
  ) {
    const analytics: Record<string, any> = {};
    for (const pergunta of perguntas) {
      const counts: Record<string, number> = {};
      let total = 0,
        soma = 0;
      for (const resposta of respostas) {
        const r = resposta.respostas?.[pergunta.id];
        if (r === undefined || r === null) continue;
        total++;
        if (pergunta.tipo === "escala") {
          soma += Number(r);
        } else if (pergunta.tipo === "multipla_escolha" && Array.isArray(r)) {
          r.forEach((v: string) => {
            const l = altMap[v] || v;
            counts[l] = (counts[l] || 0) + 1;
          });
        } else {
          const l = altMap[String(r)] || String(r);
          counts[l] = (counts[l] || 0) + 1;
        }
      }
      analytics[pergunta.id] = {
        total,
        counts,
        media: total > 0 && pergunta.tipo === "escala" ? soma / total : null,
      };
    }
    return analytics;
  }

  private calcularIndiceMunicipal(analytics: any, perguntas: any[]): number {
    const escalas = perguntas.filter((p) => p.tipo === "escala");
    if (!escalas.length) return 50;
    let soma = 0,
      count = 0;
    for (const p of escalas) {
      const data = analytics[p.id];
      if (data?.media != null && data.total > 0) {
        soma +=
          ((data.media - (p.escalaMin || 1)) /
            ((p.escalaMax || 10) - (p.escalaMin || 1))) *
          100;
        count++;
      }
    }
    return count > 0 ? Math.round(soma / count) : 50;
  }

  private gerarConclusaoAutomatica(
    pesquisa: any,
    totalTokens: number,
    totalRespostas: number,
    taxa: number,
    indice: number,
    bairroMap: any,
    ranking: any[],
  ): string {
    const nivel =
      indice >= 70 ? "positivo" : indice >= 40 ? "moderado" : "crítico";
    const participacao =
      taxa >= 60 ? "expressiva" : taxa >= 30 ? "satisfatória" : "baixa";
    const bairros = Object.keys(bairroMap).length;
    const melhorBairro = Object.values(bairroMap).sort(
      (a: any, b: any) =>
        b.respostas / Math.max(b.tokens, 1) -
        a.respostas / Math.max(a.tokens, 1),
    )[0] as any;
    const detalhe =
      indice >= 70
        ? "Este resultado demonstra uma percepção majoritariamente positiva da gestão municipal e dos serviços públicos."
        : indice >= 40
          ? "Este resultado indica áreas de atenção que merecem investimento e melhoria por parte da gestão municipal."
          : "Este resultado sinaliza insatisfação significativa e demanda ações prioritárias da gestão municipal.";

    const topRanking =
      ranking.length > 0
        ? `\n\nAs principais demandas identificadas foram: ${ranking
            .slice(0, 3)
            .map((r) => `"${r.pergunta.substring(0, 50)}"`)
            .join(", ")}.`
        : "";

    return (
      `A pesquisa "${pesquisa.nome}", realizada no município de ${pesquisa.municipio?.nome} (${pesquisa.municipio?.estado}), obteve uma participação ${participacao} de ${totalRespostas} resposta(s) de um total de ${totalTokens} convites distribuídos, representando uma taxa de participação de ${taxa}%.\n\n` +
      `A pesquisa abrangeu ${bairros} bairro(s) do município, com destaque para o bairro "${melhorBairro?.nome || ""}", que apresentou o maior índice de participação relativa.${topRanking}\n\n` +
      `Com base nas avaliações coletadas, o Índice Municipal calculado foi de ${indice} pontos (escala de 0 a 100), classificado como ${nivel.toUpperCase()}. ${detalhe}\n\n` +
      `Os dados coletados fornecem subsídios importantes para o planejamento e a tomada de decisões, permitindo identificar demandas e prioridades da população de forma georreferenciada por bairro.\n\n` +
      `Este relatório foi gerado automaticamente pela plataforma Opinia em ${new Date().toLocaleString("pt-BR")}.`
    );
  }
}
