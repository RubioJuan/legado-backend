import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn
} from "typeorm";
import { BoardState as BoardStateEntity } from "./board-state.entity";
import { Level } from "./level.entity";

@Entity()
export class Board extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  idGoalScorer: number | null;

  @Column({ type: 'int', nullable: true })
  idCreator1: number | null;

  @Column({ type: 'int', nullable: true })
  idCreator2: number | null;

  @Column({ type: 'int', nullable: true })
  idGenerator1: number | null;

  @Column({ type: 'int', nullable: true })
  idGenerator2: number | null;

  @Column({ type: 'int', nullable: true })
  idGenerator3: number | null;

  @Column({ type: 'int', nullable: true })
  idGenerator4: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender1: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender2: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender3: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender4: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender5: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender6: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender7: number | null;

  @Column({ type: 'int', nullable: true })
  idDefender8: number | null;

  @Column({ type: 'int' })
  idLevelId: number;

  @ManyToOne(() => Level, { eager: false, nullable: false })
  @JoinColumn({ name: "idLevelId", referencedColumnName: "id" })
  level: Level;

  @Column({ type: 'int' })
  idBoardState: number;

  @ManyToOne(() => BoardStateEntity, { eager: false, nullable: false })
  @JoinColumn({ name: "idBoardState", referencedColumnName: "id" })
  boardState: BoardStateEntity;

  @Column({ type: 'int', nullable: true, default: null })
  currentBlockadeStage: number | null;

  @Column({ type: 'boolean', default: false })
  isAwaitingUserCreation: boolean;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;
}
