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
import { CrossBoardLinksService } from './cross-board-links.service';
import {
  CreateCrossBoardLinkDto,
  UpdateCrossBoardLinkDto,
  CrossBoardLinkFilterDto,
} from './dto/cross-board-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cross-board-links')
@Controller('cross-board-links')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CrossBoardLinksController {
  constructor(private readonly crossBoardLinksService: CrossBoardLinksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a cross-board link between components' })
  @ApiResponse({
    status: 201,
    description: 'Link created successfully',
  })
  async create(
    @Body() createCrossBoardLinkDto: CreateCrossBoardLinkDto,
    @Request() req: any,
  ) {
    return this.crossBoardLinksService.create(req.user.sub, createCrossBoardLinkDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cross-board links' })
  @ApiResponse({
    status: 200,
    description: 'Links retrieved successfully',
  })
  async findAll(
    @Query() filterDto: CrossBoardLinkFilterDto,
    @Request() req: any,
  ) {
    return this.crossBoardLinksService.findAll(req.user.sub, filterDto);
  }

  @Get('valid-transitions')
  @ApiOperation({ summary: 'Get valid reference model transitions' })
  @ApiResponse({
    status: 200,
    description: 'Valid transitions retrieved successfully',
  })
  async getValidTransitions() {
    return this.crossBoardLinksService.getValidTransitions();
  }

  @Get(':linkId')
  @ApiOperation({ summary: 'Get a specific cross-board link' })
  @ApiResponse({
    status: 200,
    description: 'Link retrieved successfully',
  })
  async findOne(
    @Param('linkId') linkId: string,
    @Request() req: any,
  ) {
    return this.crossBoardLinksService.findOne(linkId, req.user.sub);
  }

  @Patch(':linkId')
  @ApiOperation({ summary: 'Update a cross-board link' })
  @ApiResponse({
    status: 200,
    description: 'Link updated successfully',
  })
  async update(
    @Param('linkId') linkId: string,
    @Body() updateCrossBoardLinkDto: UpdateCrossBoardLinkDto,
    @Request() req: any,
  ) {
    return this.crossBoardLinksService.update(
      linkId,
      req.user.sub,
      updateCrossBoardLinkDto,
    );
  }

  @Delete(':linkId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cross-board link' })
  @ApiResponse({
    status: 204,
    description: 'Link deleted successfully',
  })
  async delete(
    @Param('linkId') linkId: string,
    @Request() req: any,
  ) {
    return this.crossBoardLinksService.delete(linkId, req.user.sub);
  }

  @Get('component/:componentId')
  @ApiOperation({
    summary: 'Get all cross-board links involving a specific component',
  })
  @ApiResponse({
    status: 200,
    description: 'Links retrieved successfully',
  })
  async findByComponent(
    @Param('componentId') componentId: string,
    @Request() req: any,
  ) {
    return this.crossBoardLinksService.findByComponent(componentId, req.user.sub);
  }
}
