import { Controller, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RefModelsService } from './ref-models.service';

@ApiTags('Reference Models')
@Controller('reference-models')
export class RefModelsController {
  constructor(private readonly refModelsService: RefModelsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all FEAF reference models' })
  @ApiResponse({
    status: 200,
    description: 'List of all reference models',
  })
  getAllModels() {
    return this.refModelsService.getAllModels();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific reference model by ID' })
  @ApiResponse({
    status: 200,
    description: 'Reference model details',
  })
  getModelById(@Param('id') id: string) {
    const model = this.refModelsService.getModelById(id);
    if (!model) {
      return {
        error: 'Reference model not found',
      };
    }
    return model;
  }
}
