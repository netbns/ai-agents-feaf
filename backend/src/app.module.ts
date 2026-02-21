import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/config.module';
import { AuthModule } from './domain/auth/auth.module';
import { BoardsModule } from './domain/boards/boards.module';
import { ComponentsModule } from './domain/components/components.module';
import { RelationshipsModule } from './domain/relationships/relationships.module';
import { CrossBoardLinksModule } from './domain/cross-board-links/cross-board-links.module';
import { RefModelsModule } from './domain/ref-models/ref-models.module';
import { HealthModule } from './domain/health/health.module';
import { DaprModule } from './domain/dapr/dapr.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigurationModule,
    AuthModule,
    BoardsModule,
    ComponentsModule,
    RelationshipsModule,
    CrossBoardLinksModule,
    RefModelsModule,
    HealthModule,
    DaprModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
