import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { StoryService } from './story.service';
import { AdvanceDto } from './dto/advance.dto';
import { AdvanceMultiDto } from './dto/advance-multi.dto';
import { AdvanceDualDto } from './dto/advance-dual.dto';

@Controller('story')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * 单角色剧情推进
   */
  @Post('advance')
  @HttpCode(HttpStatus.OK)
  async advance(@Body() advanceDto: AdvanceDto) {
    return this.storyService.advance(advanceDto);
  }

  /**
   * 多角色剧情推进
   */
  @Post('advance-multi')
  @HttpCode(HttpStatus.OK)
  async advanceMulti(@Body() advanceMultiDto: AdvanceMultiDto) {
    return this.storyService.advanceMulti(advanceMultiDto);
  }

  /**
   * 双角色剧情推进
   */
  @Post('advance-dual')
  @HttpCode(HttpStatus.OK)
  async advanceDual(@Body() advanceDualDto: AdvanceDualDto) {
    return this.storyService.advanceDual(advanceDualDto);
  }
}
