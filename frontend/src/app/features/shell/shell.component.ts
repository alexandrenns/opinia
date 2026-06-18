import { Component, OnInit, ViewChild } from "@angular/core";
import { MatSidenav } from "@angular/material/sidenav";
import { MatDialog } from "@angular/material/dialog";
import { Router, NavigationEnd } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { ChangePasswordDialogComponent } from "./change-password-dialog/change-password-dialog.component";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-shell",
  templateUrl: "./shell.component.html",
  styleUrls: ["./shell.component.scss"],
})
export class ShellComponent implements OnInit {
  @ViewChild("sidenav") sidenav!: MatSidenav;

  user: any;
  sidenavOpened = true;
  currentRoute = "";

  navItems = [
    { label: "Dashboard", icon: "dashboard", route: "/dashboard" },
    { label: "Pesquisas", icon: "poll", route: "/pesquisas" },
    { label: "Municípios", icon: "location_city", route: "/municipios" },
    { label: "Bairros", icon: "map", route: "/bairros" },
    { label: "Contratantes", icon: "business_center", route: "/contratantes" },
    { label: "Ofícios", icon: "description", route: "/oficios" },
    { label: "Configuração", icon: "settings", route: "/configuracao" },
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.user = this.auth.getUser();
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentRoute = e.urlAfterRedirects;
      });
    this.currentRoute = this.router.url;
  }

  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  openChangePassword() {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: "420px",
      maxWidth: "95vw",
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(["/auth/login"]);
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }
}
