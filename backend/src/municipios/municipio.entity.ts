import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Bairro } from '../bairros/bairro.entity';
import { Pesquisa } from '../pesquisas/pesquisa.entity';

@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column()
  estado: string;

  @Column({ nullable: true })
  populacao: number;

  @Column({ nullable: true })
  brasao: string;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => Bairro, (b) => b.municipio)
  bairros: Bairro[];

  @OneToMany(() => Pesquisa, (p) => p.municipio)
  pesquisas: Pesquisa[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
