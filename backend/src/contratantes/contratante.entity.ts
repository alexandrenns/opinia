import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Pesquisa } from '../pesquisas/pesquisa.entity';

export type TipoContratante = 'Vereador' | 'Pré-candidato' | 'Partido' | 'Consultor' | 'Outros';

@Entity('contratantes')
export class Contratante {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ nullable: true })
  telefone: string;

  @Column({ nullable: true, type: 'text' })
  observacoes: string;

  @Column({ default: 'Outros' })
  tipo: string;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => Pesquisa, (p) => p.contratante)
  pesquisas: Pesquisa[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
