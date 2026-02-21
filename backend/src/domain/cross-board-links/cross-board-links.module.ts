import { Module } from '@nestjs/common';
import { CrossBoardLinksService } from './cross-board-links.service';
import { CrossBoardLinksController } from './cross-board-links.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprModule } from '../dapr/dapr.module';

@Module({
  imports: [DaprModule],
  controllers: [CrossBoardLinksController],
  providers: [CrossBoardLinksService, PrismaService],
  exports: [CrossBoardLinksService],
})
export class CrossBoardLinksModule {}
