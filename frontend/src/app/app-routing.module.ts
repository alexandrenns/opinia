import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";

const routes: Routes = [
  // ── Site institucional — rota raiz, sem guard ──────────────────────────────
  {
    path: "",
    pathMatch: "full",
    loadChildren: () =>
      import("./pages/home/home.module").then((m) => m.HomeModule),
  },

  // ── Autenticação — /auth/login ─────────────────────────────────────────────
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.module").then((m) => m.AuthModule),
  },

  // ── Portal público de pesquisa — /r/:token ─────────────────────────────────
  {
    path: "r",
    loadChildren: () =>
      import("./pages/survey/survey.module").then((m) => m.SurveyModule),
  },

  // ── Área administrativa protegida — guard redireciona para /auth/login ──────
  {
    path: "",
    canActivate: [AuthGuard],
    loadChildren: () =>
      import("./features/shell/shell.module").then((m) => m.ShellModule),
  },

  // ── Rota inválida → home ───────────────────────────────────────────────────
  { path: "**", redirectTo: "" },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: "top",
      onSameUrlNavigation: "reload",
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
