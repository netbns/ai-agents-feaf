import { Module } from '@nestjs/common';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { DaprModule } from '../dapr/dapr.module';
import { RefModelsModule } from '../ref-models/ref-models.module';

@Module({
  imports: [DaprModule, RefModelsModule],
  controllers: [ComponentsController],
  providers: [ComponentsService, PrismaService],
  exports: [ComponentsService],
})
export class ComponentsModule {}
