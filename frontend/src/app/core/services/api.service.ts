import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpHeaders } from "@angular/common/http";
import { environment } from "../../../environments/environment";

@Injectable({ providedIn: "root" })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Gera os headers com o token sempre atualizado do localStorage
  private get headers(): HttpHeaders {
    const token = localStorage.getItem("opinia_token");
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : "",
    });
  }

  private get jsonHeaders(): HttpHeaders {
    const token = localStorage.getItem("opinia_token");
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    });
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardIndicadores() {
    return this.http.get<any>(`${this.base}/dashboard/indicadores`, {
      headers: this.headers,
    });
  }
  getDashboardPorMunicipio() {
    return this.http.get<any[]>(
      `${this.base}/dashboard/pesquisas-por-municipio`,
      { headers: this.headers },
    );
  }
  getDashboardParticipacao() {
    return this.http.get<any[]>(`${this.base}/dashboard/participacao`, {
      headers: this.headers,
    });
  }
  getDashboardEvolucao() {
    return this.http.get<any[]>(`${this.base}/dashboard/evolucao`, {
      headers: this.headers,
    });
  }

  // ── Municipios ────────────────────────────────────────────────────────────
  getMunicipios() {
    return this.http.get<any[]>(`${this.base}/municipios`, {
      headers: this.headers,
    });
  }
  getMunicipio(id: string) {
    return this.http.get<any>(`${this.base}/municipios/${id}`, {
      headers: this.headers,
    });
  }
  createMunicipio(fd: FormData) {
    return this.http.post<any>(`${this.base}/municipios`, fd, {
      headers: this.headers,
    });
  }
  updateMunicipio(id: string, fd: FormData) {
    return this.http.put<any>(`${this.base}/municipios/${id}`, fd, {
      headers: this.headers,
    });
  }
  deleteMunicipio(id: string) {
    return this.http.delete<any>(`${this.base}/municipios/${id}`, {
      headers: this.headers,
    });
  }

  // ── Bairros ───────────────────────────────────────────────────────────────
  getBairros(municipioId?: string) {
    const params = municipioId
      ? new HttpParams().set("municipioId", municipioId)
      : undefined;
    return this.http.get<any[]>(`${this.base}/bairros`, {
      headers: this.headers,
      params,
    });
  }
  createBairro(data: any) {
    return this.http.post<any>(`${this.base}/bairros`, data, {
      headers: this.jsonHeaders,
    });
  }
  updateBairro(id: string, d: any) {
    return this.http.put<any>(`${this.base}/bairros/${id}`, d, {
      headers: this.jsonHeaders,
    });
  }
  deleteBairro(id: string) {
    return this.http.delete<any>(`${this.base}/bairros/${id}`, {
      headers: this.headers,
    });
  }

  // ── Contratantes ──────────────────────────────────────────────────────────
  getContratantes() {
    return this.http.get<any[]>(`${this.base}/contratantes`, {
      headers: this.headers,
    });
  }
  createContratante(d: any) {
    return this.http.post<any>(`${this.base}/contratantes`, d, {
      headers: this.jsonHeaders,
    });
  }
  updateContratante(id: string, d: any) {
    return this.http.put<any>(`${this.base}/contratantes/${id}`, d, {
      headers: this.jsonHeaders,
    });
  }
  deleteContratante(id: string) {
    return this.http.delete<any>(`${this.base}/contratantes/${id}`, {
      headers: this.headers,
    });
  }

  // ── Pesquisas ─────────────────────────────────────────────────────────────
  getPesquisas() {
    return this.http.get<any[]>(`${this.base}/pesquisas`, {
      headers: this.headers,
    });
  }
  getPesquisa(id: string) {
    return this.http.get<any>(`${this.base}/pesquisas/${id}`, {
      headers: this.headers,
    });
  }
  createPesquisa(d: any) {
    return this.http.post<any>(`${this.base}/pesquisas`, d, {
      headers: this.jsonHeaders,
    });
  }
  updatePesquisa(id: string, d: any) {
    return this.http.put<any>(`${this.base}/pesquisas/${id}`, d, {
      headers: this.jsonHeaders,
    });
  }
  deletePesquisa(id: string) {
    return this.http.delete<any>(`${this.base}/pesquisas/${id}`, {
      headers: this.headers,
    });
  }

  // ── Perguntas ─────────────────────────────────────────────────────────────
  getPerguntas(pesquisaId: string) {
    return this.http.get<any[]>(`${this.base}/perguntas`, {
      headers: this.headers,
      params: new HttpParams().set("pesquisaId", pesquisaId),
    });
  }
  createPergunta(d: any) {
    return this.http.post<any>(`${this.base}/perguntas`, d, {
      headers: this.jsonHeaders,
    });
  }
  updatePergunta(id: string, d: any) {
    return this.http.put<any>(`${this.base}/perguntas/${id}`, d, {
      headers: this.jsonHeaders,
    });
  }
  deletePergunta(id: string) {
    return this.http.delete<any>(`${this.base}/perguntas/${id}`, {
      headers: this.headers,
    });
  }
  reorderPerguntas(pesquisaId: string, ids: string[]) {
    return this.http.put<any>(
      `${this.base}/perguntas/reorder`,
      { pesquisaId, ids },
      { headers: this.jsonHeaders },
    );
  }
  duplicatePergunta(id: string) {
    return this.http.post<any>(
      `${this.base}/perguntas/${id}/duplicate`,
      {},
      { headers: this.jsonHeaders },
    );
  }

  // ── Tokens ────────────────────────────────────────────────────────────────
  gerarLote(pesquisaId: string, bairroId: string, quantidade: number) {
    return this.http.post<any>(
      `${this.base}/tokens/gerar-lote`,
      { pesquisaId, bairroId, quantidade },
      { headers: this.jsonHeaders },
    );
  }
  getTokensByPesquisa(pesquisaId: string) {
    return this.http.get<any[]>(`${this.base}/tokens/pesquisa/${pesquisaId}`, {
      headers: this.headers,
    });
  }
  getTokenStats(pesquisaId: string) {
    return this.http.get<any>(`${this.base}/tokens/stats/${pesquisaId}`, {
      headers: this.headers,
    });
  }

  // ── Respostas ─────────────────────────────────────────────────────────────
  getRespostas(pesquisaId: string) {
    return this.http.get<any[]>(
      `${this.base}/respostas/pesquisa/${pesquisaId}`,
      { headers: this.headers },
    );
  }
  getAnalytics(pesquisaId: string) {
    return this.http.get<any>(
      `${this.base}/respostas/analytics/${pesquisaId}`,
      { headers: this.headers },
    );
  }

  // ── Ofícios ───────────────────────────────────────────────────────────────
  getModelos() {
    return this.http.get<any[]>(`${this.base}/oficios/modelos`, {
      headers: this.headers,
    });
  }
  createModelo(d: any) {
    return this.http.post<any>(`${this.base}/oficios/modelos`, d, {
      headers: this.jsonHeaders,
    });
  }
  updateModelo(id: string, d: any) {
    return this.http.put<any>(`${this.base}/oficios/modelos/${id}`, d, {
      headers: this.jsonHeaders,
    });
  }
  deleteModelo(id: string) {
    return this.http.delete<any>(`${this.base}/oficios/modelos/${id}`, {
      headers: this.headers,
    });
  }

  gerarOficios(pesquisaId: string, modeloId: string) {
    return this.http.post(
      `${this.base}/oficios/gerar/${pesquisaId}/modelo/${modeloId}`,
      {},
      { headers: this.headers, responseType: "blob" },
    );
  }
  gerarControle(pesquisaId: string) {
    return this.http.get(`${this.base}/oficios/controle/${pesquisaId}`, {
      headers: this.headers,
      responseType: "blob",
    });
  }

  // ── Relatórios ────────────────────────────────────────────────────────────
  gerarRelatorio(pesquisaId: string) {
    return this.http.get(`${this.base}/relatorios/${pesquisaId}`, {
      headers: this.headers,
      responseType: "blob",
    });
  }

  // ── Configuração ──────────────────────────────────────────────────────────
  getConfiguracao() {
    return this.http.get<any>(`${this.base}/configuracao`, {
      headers: this.headers,
    });
  }
  updateConfiguracao(fd: FormData) {
    return this.http.put<any>(`${this.base}/configuracao`, fd, {
      headers: this.headers,
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  changePassword(senhaAtual: string, novaSenha: string) {
    return this.http.put<any>(
      `${this.base}/auth/change-password`,
      { senhaAtual, novaSenha },
      { headers: this.jsonHeaders },
    );
  }
}
