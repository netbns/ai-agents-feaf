import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DaprClientService } from './dapr-client.service';
import { DaprStateService } from './dapr-state.service';

@Module({
  imports: [ConfigModule],
  providers: [DaprClientService, DaprStateService],
  exports: [DaprClientService, DaprStateService],
})
export class DaprModule {}
