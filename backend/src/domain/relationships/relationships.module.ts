import { Module } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { RelationshipsController } from './relationships.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprModule } from '../dapr/dapr.module';

@Module({
  imports: [DaprModule],
  controllers: [RelationshipsController],
  providers: [RelationshipsService, PrismaService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
