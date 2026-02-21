import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardFilterDto } from './dto/board-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Boards')
@Controller('boards')
@ApiBearerAuth()
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new board' })
  @ApiResponse({
    status: 201,
    description: 'Board created successfully',
  })
  create(@Request() req, @Body() createBoardDto: CreateBoardDto) {
    return this.boardsService.create(req.user.id, createBoardDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all boards for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of boards',
  })
  findAll(@Request() req, @Query() filterDto: BoardFilterDto) {
    return this.boardsService.findAll(req.user.id, filterDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific board by ID' })
  @ApiResponse({
    status: 200,
    description: 'Board details',
  })
  findOne(@Param('id') id: string, @Request() req) {
    return this.boardsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a board' })
  @ApiResponse({
    status: 200,
    description: 'Board updated successfully',
  })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, req.user.id, updateBoardDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a board' })
  @ApiResponse({
    status: 200,
    description: 'Board deleted successfully',
  })
  delete(@Param('id') id: string, @Request() req) {
    return this.boardsService.delete(id, req.user.id);
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export a board' })
  @ApiResponse({
    status: 200,
    description: 'Board exported',
  })
  export(
    @Param('id') id: string,
    @Request() req,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    return this.boardsService.export(id, req.user.id, format);
  }
}
