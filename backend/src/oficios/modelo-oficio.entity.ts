import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('modelos_oficio')
export class ModeloOficio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true, type: 'text' })
  cabecalho: string;

  @Column({ nullable: true, type: 'text' })
  textoInstitucional: string;

  @Column({ nullable: true, type: 'text' })
  rodape: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
