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
import { CharacterService } from './character.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCharacterDto: CreateCharacterDto,
  ): Promise<CharacterResponseDto> {
    return this.characterService.create(createCharacterDto);
  }

  @Get()
  async findAll(): Promise<CharacterResponseDto[]> {
    return this.characterService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CharacterResponseDto> {
    return this.characterService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ): Promise<CharacterResponseDto> {
    return this.characterService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.characterService.remove(id);
  }
}
