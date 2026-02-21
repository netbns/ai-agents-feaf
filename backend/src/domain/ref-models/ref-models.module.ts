import { Module } from '@nestjs/common';
import { RefModelsService } from './ref-models.service';
import { RefModelsController } from './ref-models.controller';

@Module({
  controllers: [RefModelsController],
  providers: [RefModelsService],
  exports: [RefModelsService],
})
export class RefModelsModule {}
