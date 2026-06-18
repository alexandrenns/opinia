import { Component, OnInit } from "@angular/core";
import { ChartConfiguration, ChartData } from "chart.js";
import { ApiService } from "../../core/services/api.service";
import { forkJoin, of } from "rxjs";
import { catchError } from "rxjs/operators";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  loading = true;
  indicadores: any = {};
  participacao: any[] = [];

  barData: ChartData<"bar"> = { labels: [], datasets: [] };
  barOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    },
  };

  lineData: ChartData<"line"> = { labels: [], datasets: [] };
  lineOptions: ChartConfiguration["options"] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
    },
    elements: { line: { tension: 0.4 } },
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    // catchError em cada chamada individualmente para não derrubar o forkJoin
    // e não disparar o logout do interceptor por um erro isolado
    forkJoin({
      indicadores: this.api
        .getDashboardIndicadores()
        .pipe(catchError(() => of({}))),
      porMunicipio: this.api
        .getDashboardPorMunicipio()
        .pipe(catchError(() => of([]))),
      participacao: this.api
        .getDashboardParticipacao()
        .pipe(catchError(() => of([]))),
      evolucao: this.api.getDashboardEvolucao().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        this.indicadores = data.indicadores || {};
        this.participacao = (data.participacao as any[]) || [];

        const porMunicipio = (data.porMunicipio as any[]) || [];
        const evolucao = (data.evolucao as any[]) || [];

        if (porMunicipio.length) {
          this.barData = {
            labels: porMunicipio.map((d: any) => d.municipio || "N/D"),
            datasets: [
              {
                data: porMunicipio.map((d: any) => +d.total),
                backgroundColor: "#1F6FB2",
                borderRadius: 6,
              },
            ],
          };
        }

        if (evolucao.length) {
          this.lineData = {
            labels: evolucao.map((d: any) => {
              const dt = new Date(d.dia);
              return `${dt.getDate()}/${dt.getMonth() + 1}`;
            }),
            datasets: [
              {
                data: evolucao.map((d: any) => +d.total),
                borderColor: "#0F4C81",
                backgroundColor: "rgba(15,76,129,.1)",
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: "#0F4C81",
              },
            ],
          };
        }

        this.loading = false;
      },
      // forkJoin nunca chega aqui pois cada observable tem seu próprio catchError
      error: () => {
        this.loading = false;
      },
    });
  }
}
