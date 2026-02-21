import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardFilterDto } from './dto/board-filter.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createBoardDto: CreateBoardDto) {
    const { name, description, referenceModel } = createBoardDto;

    // Check for duplicate board name for this user
    const existingBoard = await this.prisma.board.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existingBoard) {
      throw new BadRequestException(
        'You already have a board with this name',
      );
    }

    return this.prisma.board.create({
      data: {
        userId,
        name,
        description,
        referenceModel,
      },
      include: {
        components: true,
      },
    });
  }

  async findAll(userId: string, filterDto: BoardFilterDto) {
    const { search, referenceModel, take = 10, skip = 0 } = filterDto;

    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (referenceModel) {
      where.referenceModel = referenceModel;
    }

    const [boards, total] = await Promise.all([
      this.prisma.board.findMany({
        where,
        take: Math.min(take, 100),
        skip,
        include: {
          components: { select: { id: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.board.count({ where }),
    ]);

    return {
      boards: boards.map((board) => ({
        ...board,
        componentCount: board.components.length,
        components: undefined,
      })),
      total,
      take,
      skip,
    };
  }

  async findOne(id: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        components: true,
        relationships: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (board.userId !== userId) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return board;
  }

  async update(id: string, userId: string, updateBoardDto: UpdateBoardDto) {
    const board = await this.findOne(id, userId);

    // Check if new name is unique
    if (updateBoardDto.name && updateBoardDto.name !== board.name) {
      const existing = await this.prisma.board.findUnique({
        where: {
          userId_name: {
            userId,
            name: updateBoardDto.name,
          },
        },
      });

      if (existing) {
        throw new BadRequestException(
          'You already have a board with this name',
        );
      }
    }

    return this.prisma.board.update({
      where: { id },
      data: updateBoardDto,
    });
  }

  async delete(id: string, userId: string) {
    const board = await this.findOne(id, userId);

    return this.prisma.board.delete({
      where: { id },
    });
  }

  async export(id: string, userId: string, format: 'json' | 'csv') {
    const board = await this.findOne(id, userId);

    if (format === 'json') {
      return this.exportAsJson(board);
    } else if (format === 'csv') {
      return this.exportAsCsv(board);
    }

    throw new BadRequestException('Invalid export format');
  }

  private exportAsJson(board: any) {
    return {
      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        referenceModel: board.referenceModel,
        createdAt: board.createdAt,
      },
      components: board.components,
      relationships: board.relationships,
    };
  }

  private exportAsCsv(board: any) {
    let csv = 'Component,Type,Description\n';
    board.components.forEach((component) => {
      csv += `"${component.name}","${component.type}","${component.description || ''}"\n`;
    });
    return csv;
  }
}
