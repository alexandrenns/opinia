import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn } from 'typeorm';
import { Pesquisa } from '../pesquisas/pesquisa.entity';
import { Bairro } from '../bairros/bairro.entity';
import { Token } from './token.entity';

@Entity('lotes')
export class Lote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pesquisa, (p) => p.lotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pesquisaId' })
  pesquisa: Pesquisa;

  @Column()
  pesquisaId: string;

  @ManyToOne(() => Bairro, (b) => b.lotes)
  @JoinColumn({ name: 'bairroId' })
  bairro: Bairro;

  @Column()
  bairroId: string;

  @Column()
  quantidade: number;

  @OneToMany(() => Token, (t) => t.lote, { cascade: true })
  tokens: Token[];

  @CreateDateColumn()
  createdAt: Date;
}
