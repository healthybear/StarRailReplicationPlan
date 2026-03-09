import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SceneService } from './scene.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { SceneResponseDto } from './dto/scene-response.dto';

@Controller('scenes')
export class SceneController {
  constructor(private readonly sceneService: SceneService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createSceneDto: CreateSceneDto,
  ): Promise<SceneResponseDto> {
    return this.sceneService.create(createSceneDto);
  }

  @Get()
  async findAll(): Promise<SceneResponseDto[]> {
    return this.sceneService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SceneResponseDto> {
    return this.sceneService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSceneDto: UpdateSceneDto,
  ): Promise<SceneResponseDto> {
    return this.sceneService.update(id, updateSceneDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.sceneService.remove(id);
  }
}
