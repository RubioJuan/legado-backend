import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Board } from './board.entity'; // Assuming Board entity path
import { Level } from './level.entity'; // Assuming Level entity path
import { EntityUser } from './user.entity'; // Assuming User entity path

export enum WaitingReason {
  HIGHER_RANK_SLOTS_EXIST = 'HIGHER_RANK_SLOTS_EXIST_ON_TARGET',
  NO_RECRUIT_SLOTS = 'NO_RECRUIT_SLOTS_ON_TARGET',
  // Add other reasons as needed
}

@Entity('general_awaiting_recruit_slot')
@Index(['userId', 'targetRecruitLevelId'])
@Unique(['userId']) // Ensures a user is only in the queue once
export class GeneralAwaitingRecruitSlot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => EntityUser, { onDelete: 'CASCADE' }) // If user is deleted, remove from queue
  @JoinColumn({ name: 'userId' })
  user: EntityUser;

  @Column()
  primaryBoardId: number;

  @ManyToOne(() => Board, { onDelete: 'CASCADE' }) // If board is deleted, this record might become invalid or need cleanup
  @JoinColumn({ name: 'primaryBoardId' })
  primaryBoard: Board;

  @Column()
  primaryLevelId: number;

  @ManyToOne(() => Level) // No cascade delete, level deletion is a bigger operation
  @JoinColumn({ name: 'primaryLevelId' })
  primaryLevel: Level;

  @Column()
  targetRecruitLevelId: number;

  @ManyToOne(() => Level)
  @JoinColumn({ name: 'targetRecruitLevelId' })
  targetRecruitLevel: Level;

  @Column({
    type: 'enum',
    enum: WaitingReason,
    nullable: true, // It might be null if entry is just created before reason is determined
  })
  reasonForWaiting: WaitingReason | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 