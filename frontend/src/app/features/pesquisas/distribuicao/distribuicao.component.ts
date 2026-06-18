import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FormBuilder, Validators } from "@angular/forms";
import { ApiService } from "../../../core/services/api.service";
import { NotificationService } from "../../../core/services/notification.service";

@Component({
  selector: "app-distribuicao",
  templateUrl: "./distribuicao.component.html",
  styleUrls: ["./distribuicao.component.scss"],
})
export class DistribuicaoComponent implements OnInit {
  pesquisaId!: string;
  pesquisa: any;
  bairros: any[] = [];
  lotes: any[] = [];
  modelos: any[] = [];
  loading = true;
  gerandoTokens = false;
  gerandoOficios = false;

  form = this.fb.group({
    bairroId: ["", Validators.required],
    quantidade: [
      100,
      [Validators.required, Validators.min(1), Validators.max(50000)],
    ],
    modeloId: [""],
  });

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.pesquisaId = this.route.snapshot.params["id"];
    this.api.getPesquisa(this.pesquisaId).subscribe((p) => {
      this.pesquisa = p;
      this.api.getBairros(p.municipioId).subscribe((b) => {
        this.bairros = b.filter((x: any) => x.ativo);
      });
    });
    this.api.getModelos().subscribe((m) => {
      this.modelos = m.filter((x: any) => x.ativo);
    });
    this.loadLotes();
  }

  loadLotes() {
    this.loading = true;
    this.api.getTokensByPesquisa(this.pesquisaId).subscribe({
      next: (data) => {
        this.lotes = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  gerarLote() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.gerandoTokens = true;
    const { bairroId, quantidade } = this.form.value;

    this.api.gerarLote(this.pesquisaId, bairroId!, quantidade!).subscribe({
      next: () => {
        this.notify.success(`${quantidade} tokens gerados com sucesso!`);
        this.form.get("bairroId")?.reset("");
        this.form.get("quantidade")?.setValue(100);
        this.gerandoTokens = false;
        this.loadLotes();
      },
      error: (e) => {
        this.gerandoTokens = false;
        this.notify.error(e.error?.message || "Erro ao gerar tokens");
      },
    });
  }

  gerarOficios() {
    const modeloId = this.form.get("modeloId")?.value;
    if (!modeloId) {
      this.notify.error("Selecione um modelo de ofício");
      return;
    }
    this.gerandoOficios = true;
    this.api.gerarOficios(this.pesquisaId, modeloId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `oficios-${this.pesquisa?.nome}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.gerandoOficios = false;
        this.notify.success("PDF de ofícios gerado!");
      },
      error: () => {
        this.gerandoOficios = false;
        this.notify.error("Erro ao gerar ofícios");
      },
    });
  }

  downloadControle() {
    this.api.gerarControle(this.pesquisaId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob as Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `controle-${this.pesquisaId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notify.error("Erro ao gerar PDF de controle"),
    });
  }

  // ── Lote helpers (never call filter() inside templates) ───────────────────

  getLoteTotal(lote: any): number {
    return lote.tokens?.length || 0;
  }

  getLoteUsados(lote: any): number {
    return lote.tokens?.filter((t: any) => t.usado)?.length || 0;
  }

  getLoteTaxa(lote: any): number {
    const total = this.getLoteTotal(lote);
    const usados = this.getLoteUsados(lote);
    return total > 0 ? Math.round((usados / total) * 100) : 0;
  }

  // ── Totals ────────────────────────────────────────────────────────────────

  get totalTokens(): number {
    return this.lotes.reduce((s, l) => s + this.getLoteTotal(l), 0);
  }

  get totalUsados(): number {
    return this.lotes.reduce((s, l) => s + this.getLoteUsados(l), 0);
  }

  get taxaGeral(): number {
    return this.totalTokens > 0
      ? Math.round((this.totalUsados / this.totalTokens) * 100)
      : 0;
  }
}
