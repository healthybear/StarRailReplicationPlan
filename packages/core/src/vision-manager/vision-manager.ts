import { injectable, inject } from 'tsyringe';
import type { Information, InformationStore } from '@star-rail/types';
import { generateInformationId } from '@star-rail/types';
import type { StorageAdapter } from '@star-rail/infrastructure';

/**
 * 视野管理器
 * 管理全局信息库和各人物的已知信息
 */
@injectable()
export class VisionManager {
  constructor(@inject('StorageAdapter') private storage: StorageAdapter) {}

  /**
   * 获取人物的过滤后视野
   * 返回该人物已知的信息子集
   * @param characterId 人物 ID
   * @param informationStore 信息库
   */
  getFilteredVision(
    characterId: string,
    informationStore: InformationStore
  ): Information[] {
    const knownIds = informationStore.byCharacter[characterId] || [];
    return informationStore.global.filter((info) => knownIds.includes(info.id));
  }

  /**
   * 添加信息到全局信息库
   * @param informationStore 信息库
   * @param info 信息内容（不含 ID）
   */
  addGlobalInformation(
    informationStore: InformationStore,
    info: Omit<Information, 'id'>
  ): Information {
    const newInfo: Information = {
      ...info,
      id: generateInformationId(),
    };
    informationStore.global.push(newInfo);
    return newInfo;
  }

  /**
   * 将信息归属给人物
   * @param informationStore 信息库
   * @param characterId 人物 ID
   * @param informationId 信息 ID
   */
  assignInformationToCharacter(
    informationStore: InformationStore,
    characterId: string,
    informationId: string
  ): void {
    if (!informationStore.byCharacter[characterId]) {
      informationStore.byCharacter[characterId] = [];
    }

    if (!informationStore.byCharacter[characterId].includes(informationId)) {
      informationStore.byCharacter[characterId].push(informationId);
    }
  }

  /**
   * 批量归属信息给在场人物
   * @param informationStore 信息库
   * @param characterIds 人物 ID 列表
   * @param informationId 信息 ID
   */
  assignInformationToCharacters(
    informationStore: InformationStore,
    characterIds: string[],
    informationId: string
  ): void {
    for (const characterId of characterIds) {
      this.assignInformationToCharacter(
        informationStore,
        characterId,
        informationId
      );
    }
  }

  /**
   * 检查人物是否知道某信息
   * @param informationStore 信息库
   * @param characterId 人物 ID
   * @param informationId 信息 ID
   */
  characterKnowsInformation(
    informationStore: InformationStore,
    characterId: string,
    informationId: string
  ): boolean {
    const knownIds = informationStore.byCharacter[characterId] || [];
    return knownIds.includes(informationId);
  }
}
