import { BaseEntity, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("association") // Changed from "associations" to "association"
export class Association extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // Agrega aquí otras columnas que necesites para la entidad Association
  // Por ejemplo:
  // @Column({ length: 100, nullable: true })
  // name?: string;
}