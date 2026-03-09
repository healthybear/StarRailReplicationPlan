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
import { SnapshotService } from './snapshot.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Controller('snapshots')
export class SnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  /**
   * 创建快照
   */
  @Post(':sessionId')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('sessionId') sessionId: string,
    @Body() createSnapshotDto: CreateSnapshotDto,
  ) {
    return this.snapshotService.create(sessionId, createSnapshotDto);
  }

  /**
   * 获取快照列表
   */
  @Get(':sessionId')
  async findAll(@Param('sessionId') sessionId: string) {
    return this.snapshotService.findAll(sessionId);
  }

  /**
   * 恢复快照
   */
  @Post(':sessionId/:id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('sessionId') sessionId: string,
    @Param('id') id: string,
  ) {
    return this.snapshotService.restore(sessionId, id);
  }

  /**
   * 删除快照
   */
  @Delete(':sessionId/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('sessionId') sessionId: string, @Param('id') id: string) {
    await this.snapshotService.remove(sessionId, id);
  }
}
