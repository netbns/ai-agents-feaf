import { IsString, IsEnum, IsOptional } from 'class-validator';
import { RelationshipType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRelationshipDto {
  @ApiProperty({ example: 'component-1-id' })
  @IsString()
  sourceComponentId: string;

  @ApiProperty({ example: 'component-2-id' })
  @IsString()
  targetComponentId: string;

  @ApiProperty({
    enum: ['DEPENDS_ON', 'COMMUNICATES_WITH', 'CONTAINS', 'SUPPORTS', 'IMPLEMENTS'],
    example: 'DEPENDS_ON',
  })
  @IsEnum([
    'DEPENDS_ON',
    'COMMUNICATES_WITH',
    'CONTAINS',
    'SUPPORTS',
    'IMPLEMENTS',
  ])
  type: RelationshipType;

  @ApiPropertyOptional({ example: 'Critical dependency' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRelationshipDto {
  @ApiPropertyOptional({
    enum: ['DEPENDS_ON', 'COMMUNICATES_WITH', 'CONTAINS', 'SUPPORTS', 'IMPLEMENTS'],
  })
  @IsOptional()
  @IsEnum([
    'DEPENDS_ON',
    'COMMUNICATES_WITH',
    'CONTAINS',
    'SUPPORTS',
    'IMPLEMENTS',
  ])
  type?: RelationshipType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class RelationshipFilterDto {
  @ApiPropertyOptional({
    enum: ['DEPENDS_ON', 'COMMUNICATES_WITH', 'CONTAINS', 'SUPPORTS', 'IMPLEMENTS'],
  })
  @IsOptional()
  type?: RelationshipType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number = 20;
}
