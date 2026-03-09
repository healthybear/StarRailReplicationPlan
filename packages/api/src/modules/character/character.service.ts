import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CharacterResponseDto } from './dto/character-response.dto';

@Injectable()
export class CharacterService {
  // 临时使用内存存储，后续可替换为数据库
  private characters: Map<string, CharacterResponseDto> = new Map();

  async create(
    createCharacterDto: CreateCharacterDto,
  ): Promise<CharacterResponseDto> {
    const { characterId } = createCharacterDto;

    if (this.characters.has(characterId)) {
      throw new Error(`Character with ID ${characterId} already exists`);
    }

    const character: CharacterResponseDto = {
      ...createCharacterDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.characters.set(characterId, character);
    return character;
  }

  async findAll(): Promise<CharacterResponseDto[]> {
    return Array.from(this.characters.values());
  }

  async findOne(id: string): Promise<CharacterResponseDto> {
    const character = this.characters.get(id);

    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }

    return character;
  }

  async update(
    id: string,
    updateCharacterDto: UpdateCharacterDto,
  ): Promise<CharacterResponseDto> {
    const character = await this.findOne(id);

    const updatedCharacter: CharacterResponseDto = {
      ...character,
      ...updateCharacterDto,
      updatedAt: new Date(),
    };

    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    this.characters.delete(id);
  }
}
