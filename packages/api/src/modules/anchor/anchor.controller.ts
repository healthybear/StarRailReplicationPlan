import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AnchorService } from './anchor.service';
import { CreateAnchorDto } from './dto/create-anchor.dto';
import { CompareAnchorDto } from './dto/compare-anchor.dto';
import { AnchorResponseDto } from './dto/anchor-response.dto';
import { ComparisonResponseDto } from './dto/comparison-response.dto';

@Controller('anchors')
export class AnchorController {
  constructor(private readonly anchorService: AnchorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createAnchorDto: CreateAnchorDto,
  ): Promise<AnchorResponseDto> {
    return this.anchorService.create(createAnchorDto);
  }

  @Get(':sessionId')
  async findAll(
    @Param('sessionId') sessionId: string,
  ): Promise<AnchorResponseDto[]> {
    return this.anchorService.findAll(sessionId);
  }

  @Get(':sessionId/:anchorId')
  async findOne(
    @Param('sessionId') sessionId: string,
    @Param('anchorId') anchorId: string,
  ): Promise<AnchorResponseDto> {
    return this.anchorService.findOne(sessionId, anchorId);
  }

  @Delete(':sessionId/:anchorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('sessionId') sessionId: string,
    @Param('anchorId') anchorId: string,
  ): Promise<void> {
    return this.anchorService.remove(sessionId, anchorId);
  }

  @Post('compare')
  async compare(
    @Body() compareAnchorDto: CompareAnchorDto,
  ): Promise<ComparisonResponseDto> {
    return this.anchorService.compare(compareAnchorDto);
  }
}
