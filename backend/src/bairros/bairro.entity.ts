import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany, JoinColumn } from 'typeorm';
import { Municipio } from '../municipios/municipio.entity';
import { Lote } from '../tokens/lote.entity';

@Entity('bairros')
export class Bairro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Municipio, (m) => m.bairros)
  @JoinColumn({ name: 'municipioId' })
  municipio: Municipio;

  @Column()
  municipioId: string;

  @Column()
  nome: string;

  @Column({ default: true })
  ativo: boolean;

  @OneToMany(() => Lote, (l) => l.bairro)
  lotes: Lote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
