import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionListQueryDto } from './dto/session-query.dto';

@ApiTags('sessions')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建会话', description: '创建一个新的游戏会话' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async create(@Body() createSessionDto: CreateSessionDto) {
    return this.sessionService.create(createSessionDto);
  }

  @Get()
  @ApiOperation({
    summary: '获取会话列表',
    description: '获取所有会话列表，支持分页和搜索',
  })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async findAll(@Query() query: SessionListQueryDto) {
    return this.sessionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: '获取会话详情',
    description: '根据 ID 获取会话详细信息',
  })
  @ApiParam({ name: 'id', description: '会话 ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  async findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除会话', description: '删除指定会话' })
  @ApiParam({ name: 'id', description: '会话 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '会话不存在' })
  async remove(@Param('id') id: string) {
    await this.sessionService.remove(id);
  }
}
