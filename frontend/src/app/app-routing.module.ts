import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";

const routes: Routes = [
  // Login — sem guard
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.module").then((m) => m.AuthModule),
  },

  // Portal público de pesquisa — sem guard
  {
    path: "r",
    loadChildren: () =>
      import("./pages/survey/survey.module").then((m) => m.SurveyModule),
  },

  // Área protegida — shell com sidebar
  {
    path: "",
    canActivate: [AuthGuard],
    loadChildren: () =>
      import("./features/shell/shell.module").then((m) => m.ShellModule),
  },

  // Qualquer rota inválida vai para raiz (shell decide o redirect)
  { path: "**", redirectTo: "" },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: "top",
      // Evita que o Angular cancele a navegação antes do guard terminar
      onSameUrlNavigation: "reload",
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
