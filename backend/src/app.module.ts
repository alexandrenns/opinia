import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { MunicipiosModule } from "./municipios/municipios.module";
import { BairrosModule } from "./bairros/bairros.module";
import { ContratantesModule } from "./contratantes/contratantes.module";
import { PesquisasModule } from "./pesquisas/pesquisas.module";
import { PerguntasModule } from "./perguntas/perguntas.module";
import { TokensModule } from "./tokens/tokens.module";
import { RespostasModule } from "./respostas/respostas.module";
import { RelatoriosModule } from "./relatorios/relatorios.module";
import { ConfiguracaoModule } from "./configuracao/configuracao.module";
import { OficiosModule } from "./oficios/oficios.module";
import { PublicSurveyModule } from "./public-survey/public-survey.module";
import { DashboardModule } from "./dashboard/dashboard.module";

// Carrega o .env ANTES de qualquer módulo ser instanciado
import * as dotenv from "dotenv";
dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UsersModule,
    MunicipiosModule,
    BairrosModule,
    ContratantesModule,
    PesquisasModule,
    PerguntasModule,
    TokensModule,
    RespostasModule,
    RelatoriosModule,
    ConfiguracaoModule,
    OficiosModule,
    PublicSurveyModule,
    DashboardModule,
  ],
})
export class AppModule {}
