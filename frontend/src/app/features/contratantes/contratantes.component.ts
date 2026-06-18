import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { ApiService } from "../../core/services/api.service";
import { NotificationService } from "../../core/services/notification.service";
import { ContratanteDialogComponent } from "./contratante-dialog/contratante-dialog.component";

@Component({
  selector: "app-contratantes",
  templateUrl: "./contratantes.component.html",
  styleUrls: ["./contratantes.component.scss"],
})
export class ContratantesComponent implements OnInit {
  contratantes: any[] = [];
  filtered: any[] = [];
  loading = true;
  search = "";
  filterTipo = "";

  tipos = ["Vereador", "Pré-candidato", "Partido", "Consultor", "Outros"];

  tipoColors: Record<string, string> = {
    Vereador: "badge-primary",
    "Pré-candidato": "badge-info",
    Partido: "badge-warning",
    Consultor: "badge-success",
    Outros: "badge-default",
  };

  // Map tipo → CSS class (computed once, no pipes in template)
  private tipoClassMap: Record<string, string> = {
    Vereador: "avatar avatar-vereador",
    "Pré-candidato": "avatar avatar-pre-candidato",
    Partido: "avatar avatar-partido",
    Consultor: "avatar avatar-consultor",
    Outros: "avatar avatar-outros",
  };

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getContratantes().subscribe({
      next: (data) => {
        this.contratantes = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  applyFilter() {
    const q = this.search.toLowerCase();
    this.filtered = this.contratantes.filter((c) => {
      const matchSearch =
        !q ||
        c.nome.toLowerCase().includes(q) ||
        (c.telefone || "").includes(q);
      const matchTipo = !this.filterTipo || c.tipo === this.filterTipo;
      return matchSearch && matchTipo;
    });
  }

  openDialog(contratante?: any) {
    const ref = this.dialog.open(ContratanteDialogComponent, {
      width: "520px",
      maxWidth: "95vw",
      data: { contratante },
    });
    ref.afterClosed().subscribe((r) => {
      if (r) this.load();
    });
  }

  toggleStatus(c: any) {
    this.api.updateContratante(c.id, { ativo: !c.ativo }).subscribe({
      next: () => {
        this.notify.success(
          `Contratante ${!c.ativo ? "ativado" : "inativado"}`,
        );
        this.load();
      },
      error: (e) => this.notify.error(e.error?.message || "Erro"),
    });
  }

  delete(c: any) {
    if (!confirm(`Excluir "${c.nome}"?`)) return;
    this.api.deleteContratante(c.id).subscribe({
      next: () => {
        this.notify.success("Contratante excluído");
        this.load();
      },
      error: (e) =>
        this.notify.error(
          e.error?.message || "Não é possível excluir este contratante",
        ),
    });
  }

  getAvatarClass(tipo: string): string {
    return this.tipoClassMap[tipo] || "avatar avatar-outros";
  }

  get statsByTipo() {
    return this.tipos
      .map((t) => ({
        tipo: t,
        count: this.contratantes.filter((c) => c.tipo === t).length,
      }))
      .filter((s) => s.count > 0);
  }
}
