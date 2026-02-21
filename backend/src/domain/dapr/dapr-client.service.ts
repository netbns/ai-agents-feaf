import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';

@Injectable()
export class DaprClientService implements OnModuleInit {
  private readonly logger = new Logger(DaprClientService.name);
  private daprClient: DaprClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const daprHttpPort = this.configService.get<number>('DAPR_HTTP_PORT');
    const appId = this.configService.get<string>('DAPR_APP_ID');

    try {
      this.daprClient = new DaprClient({
        daprHost: '127.0.0.1',
        daprPort: String(daprHttpPort),
        communicationProtocol: CommunicationProtocolEnum.HTTP,
      });
      this.logger.log(
        `Dapr Client initialized: ${appId} (HTTP port: ${daprHttpPort})`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Dapr Client: ${error.message}. Dapr may not be running.`,
      );
    }
  }

  getClient(): DaprClient {
    if (!this.daprClient) {
      throw new Error(
        'Dapr Client not initialized. Make sure Dapr sidecar is running.',
      );
    }
    return this.daprClient;
  }

  isConnected(): boolean {
    return !!this.daprClient;
  }
}
