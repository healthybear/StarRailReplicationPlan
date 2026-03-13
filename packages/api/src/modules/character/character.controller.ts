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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CharacterService } from './character.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建人物', description: '创建一个新的人物角色' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: CharacterResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(
    @Body() createCharacterDto: CreateCharacterDto,
  ): Promise<CharacterResponseDto> {
    return this.characterService.create(createCharacterDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取人物列表',
    description: '获取所有人物角色列表',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: [CharacterResponseDto],
  })
  async findAll(): Promise<CharacterResponseDto[]> {
    return this.characterService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取人物详情',
    description: '根据 ID 获取人物详细信息',
  })
  @ApiParam({ name: 'id', description: '人物 ID' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: CharacterResponseDto,
  })
  @ApiResponse({ status: 404, description: '人物不存在' })
  async findOne(@Param('id') id: string): Promise<CharacterResponseDto> {
    return this.characterService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新人物', description: '更新人物信息' })
  @ApiParam({ name: 'id', description: '人物 ID' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: CharacterResponseDto,
  })
  @ApiResponse({ status: 404, description: '人物不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ): Promise<CharacterResponseDto> {
    return this.characterService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除人物', description: '删除指定人物' })
  @ApiParam({ name: 'id', description: '人物 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '人物不存在' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.characterService.remove(id);
  }
}
