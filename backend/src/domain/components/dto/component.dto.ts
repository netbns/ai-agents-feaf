import { IsString, IsOptional, IsJSON, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ReferenceModel } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PositionDto {
  @ApiProperty({ example: 100 })
  @IsOptional()
  x?: number;

  @ApiProperty({ example: 100 })
  @IsOptional()
  y?: number;

  @ApiProperty({ example: 'prm' })
  @IsOptional()
  gridPosition?: string;
}

export class CreateComponentDto {
  @ApiProperty({ example: 'KPI-001' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Primary KPI for branch success' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'KPI' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: { color: '#FF5733', icon: 'star' } })
  @IsJSON()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  @IsOptional()
  position?: PositionDto;
}

export class UpdateComponentDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsJSON()
  @IsOptional()
  properties?: Record<string, any>;

  @ApiPropertyOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  @IsOptional()
  position?: PositionDto;
}

export class ComponentFilterDto {
  @ApiPropertyOptional({ example: 'KPI' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'KPI' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number (1-indexed)' })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
