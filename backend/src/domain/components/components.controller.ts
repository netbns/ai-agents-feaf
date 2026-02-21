import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ComponentsService } from './components.service';
import { CreateComponentDto, UpdateComponentDto, ComponentFilterDto } from './dto/component.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('components')
@Controller('boards/:boardId/components')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComponentsController {
  constructor(private readonly componentsService: ComponentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new component' })
  @ApiResponse({
    status: 201,
    description: 'Component created successfully',
  })
  async create(
    @Param('boardId') boardId: string,
    @Body() createComponentDto: CreateComponentDto,
    @Request() req: any,
  ) {
    return this.componentsService.create(
      boardId,
      req.user.sub,
      createComponentDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List components on a board' })
  @ApiResponse({
    status: 200,
    description: 'Components retrieved successfully',
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Component' } },
        total: { type: 'number' },
      },
    },
  })
  async findByBoard(
    @Param('boardId') boardId: string,
    @Query() filterDto: ComponentFilterDto,
    @Request() req: any,
  ) {
    return this.componentsService.findByBoard(boardId, req.user.sub, filterDto);
  }

  @Get(':componentId')
  @ApiOperation({ summary: 'Get a specific component' })
  @ApiResponse({
    status: 200,
    description: 'Component retrieved successfully',
  })
  async findOne(
    @Param('boardId') boardId: string,
    @Param('componentId') componentId: string,
    @Request() req: any,
  ) {
    return this.componentsService.findOne(componentId, req.user.sub);
  }

  @Patch(':componentId')
  @ApiOperation({ summary: 'Update a component' })
  @ApiResponse({
    status: 200,
    description: 'Component updated successfully',
  })
  async update(
    @Param('boardId') boardId: string,
    @Param('componentId') componentId: string,
    @Body() updateComponentDto: UpdateComponentDto,
    @Request() req: any,
  ) {
    return this.componentsService.update(
      componentId,
      req.user.sub,
      updateComponentDto,
    );
  }

  @Delete(':componentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a component' })
  @ApiResponse({
    status: 204,
    description: 'Component deleted successfully',
  })
  async delete(
    @Param('boardId') boardId: string,
    @Param('componentId') componentId: string,
    @Request() req: any,
  ) {
    return this.componentsService.delete(componentId, req.user.sub);
  }

  @Patch(':boardId/positions')
  @ApiOperation({ summary: 'Bulk update component positions' })
  @ApiResponse({
    status: 200,
    description: 'Positions updated successfully',
  })
  async updateBulkPositions(
    @Param('boardId') boardId: string,
    @Body() updates: Array<{ id: string; position: any }>,
    @Request() req: any,
  ) {
    return this.componentsService.updateBulkPositions(boardId, req.user.sub, updates);
  }
}
