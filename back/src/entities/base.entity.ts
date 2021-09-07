import { ApiProperty } from '@nestjs/swagger'
import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id!: string

  @CreateDateColumn()
  @ApiProperty()
  createdAt!: Date

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt!: Date
}