import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { SceneResponseDto } from './dto/scene-response.dto';

@Injectable()
export class SceneService {
  private scenes: Map<string, SceneResponseDto> = new Map();

  async create(createSceneDto: CreateSceneDto): Promise<SceneResponseDto> {
    const { sceneId } = createSceneDto;

    if (this.scenes.has(sceneId)) {
      throw new Error(`Scene with ID ${sceneId} already exists`);
    }

    const scene: SceneResponseDto = {
      ...createSceneDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scenes.set(sceneId, scene);
    return scene;
  }

  async findAll(): Promise<SceneResponseDto[]> {
    return Array.from(this.scenes.values());
  }

  async findOne(id: string): Promise<SceneResponseDto> {
    const scene = this.scenes.get(id);

    if (!scene) {
      throw new NotFoundException(`Scene with ID ${id} not found`);
    }

    return scene;
  }

  async update(
    id: string,
    updateSceneDto: UpdateSceneDto,
  ): Promise<SceneResponseDto> {
    const scene = await this.findOne(id);

    const updatedScene: SceneResponseDto = {
      ...scene,
      ...updateSceneDto,
      updatedAt: new Date(),
    };

    this.scenes.set(id, updatedScene);
    return updatedScene;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    this.scenes.delete(id);
  }
}
