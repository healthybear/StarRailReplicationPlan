import { injectable } from 'tsyringe';
import type {
  Item,
  ItemInstance,
  ItemStore,
  WorldState,
} from '@star-rail/types';
import {
  ItemSchema,
  createEmptyItemStore,
  generateItemInstanceId,
} from '@star-rail/types';

/**
 * 道具服务
 * 管理道具定义、实例和世界道具状态
 */
@injectable()
export class ItemService {
  private itemStore: ItemStore = createEmptyItemStore();

  /**
   * 注册道具定义
   */
  registerItem(item: Item): void {
    ItemSchema.parse(item);
    this.itemStore.definitions[item.id] = item;
  }

  /**
   * 获取道具定义
   */
  getItem(itemId: string): Item | undefined {
    return this.itemStore.definitions[itemId];
  }

  /**
   * 获取所有道具定义
   */
  getAllItems(): Item[] {
    return Object.values(this.itemStore.definitions);
  }

  /**
   * 给予道具实例（添加到世界状态）
   * @returns 生成的实例 ID
   */
  giveItem(
    worldState: WorldState,
    itemId: string,
    ownerId: string,
    quantity: number = 1
  ): string {
    const instanceId = generateItemInstanceId();
    const instance: ItemInstance = {
      itemId,
      quantity,
      ownerId,
      acquiredAt: Date.now(),
    };

    if (!worldState.worldItems) {
      worldState.worldItems = {};
    }
    worldState.worldItems[instanceId] = instance;
    return instanceId;
  }

  /**
   * 移除道具实例
   */
  removeItem(worldState: WorldState, instanceId: string): boolean {
    if (!worldState.worldItems?.[instanceId]) return false;
    delete worldState.worldItems[instanceId];
    return true;
  }

  /**
   * 获取指定持有者的所有道具实例
   */
  getOwnerItems(
    worldState: WorldState,
    ownerId: string
  ): Array<{
    instanceId: string;
    instance: ItemInstance;
    item: Item | undefined;
  }> {
    if (!worldState.worldItems) return [];
    return Object.entries(worldState.worldItems)
      .filter(([, inst]) => inst.ownerId === ownerId)
      .map(([instanceId, instance]) => ({
        instanceId,
        instance,
        item: this.itemStore.definitions[instance.itemId],
      }));
  }

  /**
   * 转移道具所有权
   */
  transferItem(
    worldState: WorldState,
    instanceId: string,
    newOwnerId: string
  ): boolean {
    if (!worldState.worldItems?.[instanceId]) return false;
    worldState.worldItems[instanceId].ownerId = newOwnerId;
    return true;
  }

  /**
   * 清除道具定义（不影响世界状态中的实例）
   */
  clearDefinitions(): void {
    this.itemStore = createEmptyItemStore();
  }
}
