import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ApiService } from "../../core/services/api.service";
import { NotificationService } from "../../core/services/notification.service";
import { BairroDialogComponent } from "./bairro-dialog/bairro-dialog.component";

@Component({
  selector: "app-bairros",
  templateUrl: "./bairros.component.html",
  styleUrls: ["./bairros.component.scss"],
})
export class BairrosComponent implements OnInit {
  municipios: any[] = [];
  bairros: any[] = [];
  filtered: any[] = [];
  // Computed once, not a getter — evita recalcular a cada ciclo de change detection
  groupedBairros: { municipio: any; bairros: any[] }[] = [];
  loading = true;
  search = "";
  selectedMunicipioId = "";

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.api.getMunicipios().subscribe({
      next: (m) => {
        this.municipios = m || [];
        this.load();
      },
      error: () => this.load(),
    });
  }

  load() {
    this.loading = true;
    this.api.getBairros(this.selectedMunicipioId || undefined).subscribe({
      next: (data) => {
        this.bairros = data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = this.bairros.filter((b) => {
      if (!b) return false;
      const nomeMatch = b.nome?.toLowerCase().includes(q) ?? false;
      const municipioMatch =
        b.municipio?.nome?.toLowerCase().includes(q) ?? false;
      return !q || nomeMatch || municipioMatch;
    });
    // Recalcula o agrupamento como propriedade, não getter
    this.groupedBairros = this.buildGroups();
  }

  // Método normal em vez de getter — só é chamado quando explicitamente chamado
  buildGroups(): { municipio: any; bairros: any[] }[] {
    const map = new Map<string, { municipio: any; bairros: any[] }>();
    for (const b of this.filtered) {
      if (!b) continue;
      const key = b.municipioId || "unknown";
      if (!map.has(key)) {
        map.set(key, {
          municipio: b.municipio || { nome: "Município desconhecido" },
          bairros: [],
        });
      }
      map.get(key)!.bairros.push(b);
    }
    const groups = Array.from(map.values());
    // Sort seguro — trata null/undefined
    groups.sort((a, b) => {
      const nA = a.municipio?.nome || "";
      const nB = b.municipio?.nome || "";
      return nA.localeCompare(nB, "pt-BR");
    });
    return groups;
  }

  openDialog(bairro?: any) {
    const ref = this.dialog.open(BairroDialogComponent, {
      width: "480px",
      maxWidth: "95vw",
      data: { bairro, municipios: this.municipios },
    });
    ref.afterClosed().subscribe((r) => {
      if (r) this.load();
    });
  }

  toggleStatus(b: any) {
    this.api.updateBairro(b.id, { ativo: !b.ativo }).subscribe({
      next: () => {
        this.notify.success(`Bairro ${!b.ativo ? "ativado" : "inativado"}`);
        this.load();
      },
      error: (e) => this.notify.error(e.error?.message || "Erro ao atualizar"),
    });
  }

  delete(b: any) {
    if (!confirm(`Excluir bairro "${b.nome}"?`)) return;
    this.api.deleteBairro(b.id).subscribe({
      next: () => {
        this.notify.success("Bairro excluído");
        this.load();
      },
      error: (e) =>
        this.notify.error(
          e.error?.message || "Não é possível excluir este bairro",
        ),
    });
  }
}
