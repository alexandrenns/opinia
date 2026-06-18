import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatBadgeModule } from "@angular/material/badge";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialogModule } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ReactiveFormsModule } from "@angular/forms";
import { ShellComponent } from "./shell.component";
import { ChangePasswordDialogComponent } from "./change-password-dialog/change-password-dialog.component";

const routes: Routes = [
  {
    path: "",
    component: ShellComponent,
    children: [
      {
        path: "dashboard",
        loadChildren: () =>
          import("../dashboard/dashboard.module").then(
            (m) => m.DashboardModule,
          ),
      },
      {
        path: "municipios",
        loadChildren: () =>
          import("../municipios/municipios.module").then(
            (m) => m.MunicipiosModule,
          ),
      },
      {
        path: "bairros",
        loadChildren: () =>
          import("../bairros/bairros.module").then((m) => m.BairrosModule),
      },
      {
        path: "contratantes",
        loadChildren: () =>
          import("../contratantes/contratantes.module").then(
            (m) => m.ContratantesModule,
          ),
      },
      {
        path: "pesquisas",
        loadChildren: () =>
          import("../pesquisas/pesquisas.module").then(
            (m) => m.PesquisasModule,
          ),
      },
      {
        path: "oficios",
        loadChildren: () =>
          import("../oficios/oficios.module").then((m) => m.OficiosModule),
      },
      {
        path: "configuracao",
        loadChildren: () =>
          import("../configuracao/configuracao.module").then(
            (m) => m.ConfiguracaoModule,
          ),
      },
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
    ],
  },
];

@NgModule({
  declarations: [ShellComponent, ChangePasswordDialogComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export class ShellModule {}
