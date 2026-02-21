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
import { RelationshipsService } from './relationships.service';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
  RelationshipFilterDto,
} from './dto/relationship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('relationships')
@Controller('boards/:boardId/relationships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new relationship between components' })
  @ApiResponse({
    status: 201,
    description: 'Relationship created successfully',
  })
  async create(
    @Param('boardId') boardId: string,
    @Body() createRelationshipDto: CreateRelationshipDto,
    @Request() req: any,
  ) {
    return this.relationshipsService.create(
      boardId,
      req.user.sub,
      createRelationshipDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List relationships on a board' })
  @ApiResponse({
    status: 200,
    description: 'Relationships retrieved successfully',
  })
  async findByBoard(
    @Param('boardId') boardId: string,
    @Query() filterDto: RelationshipFilterDto,
    @Request() req: any,
  ) {
    return this.relationshipsService.findByBoard(boardId, req.user.sub, filterDto);
  }

  @Get(':relationshipId')
  @ApiOperation({ summary: 'Get a specific relationship' })
  @ApiResponse({
    status: 200,
    description: 'Relationship retrieved successfully',
  })
  async findOne(
    @Param('boardId') boardId: string,
    @Param('relationshipId') relationshipId: string,
    @Request() req: any,
  ) {
    return this.relationshipsService.findOne(relationshipId, req.user.sub);
  }

  @Patch(':relationshipId')
  @ApiOperation({ summary: 'Update a relationship' })
  @ApiResponse({
    status: 200,
    description: 'Relationship updated successfully',
  })
  async update(
    @Param('boardId') boardId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() updateRelationshipDto: UpdateRelationshipDto,
    @Request() req: any,
  ) {
    return this.relationshipsService.update(
      relationshipId,
      req.user.sub,
      updateRelationshipDto,
    );
  }

  @Delete(':relationshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a relationship' })
  @ApiResponse({
    status: 204,
    description: 'Relationship deleted successfully',
  })
  async delete(
    @Param('boardId') boardId: string,
    @Param('relationshipId') relationshipId: string,
    @Request() req: any,
  ) {
    return this.relationshipsService.delete(relationshipId, req.user.sub);
  }

  @Get('component/:componentId')
  @ApiOperation({
    summary: 'Get all relationships involving a specific component',
  })
  @ApiResponse({
    status: 200,
    description: 'Relationships retrieved successfully',
  })
  async findByComponent(
    @Param('componentId') componentId: string,
    @Request() req: any,
  ) {
    return this.relationshipsService.findByComponent(componentId, req.user.sub);
  }
}
