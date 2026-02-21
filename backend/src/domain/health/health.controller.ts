import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  async liveness() {
    return this.healthService.checkLiveness();
  }

  @Get('readiness')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  async readiness() {
    const result = await this.healthService.checkReadiness();
    const statusCode = result.status === 'ok' ? HttpStatus.OK : 503;
    return result;
  }
}
