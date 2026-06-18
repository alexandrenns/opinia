import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('configuracao_sistema')
export class ConfiguracaoSistema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Opinia' })
  nomePlataforma: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true, type: 'text' })
  textoInstitucional: string;

  @Column({ nullable: true, type: 'text' })
  rodapePadrao: string;

  @Column({ nullable: true })
  publicUrl: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
