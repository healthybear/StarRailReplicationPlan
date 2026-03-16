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
 * 道具服务 - 物品系统管理
 *
 * 职责：
 * 1. 管理道具定义（注册、查询）
 * 2. 管理道具实例（创建、查询、删除）
 * 3. 处理道具交互（给予、移除、使用）
 * 4. 管理道具状态（数量、属性）
 *
 * 道具系统结构：
 * - 道具定义（Item）：道具的模板（如"钥匙"、"药水"）
 * - 道具实例（ItemInstance）：具体的道具对象（如"1号钥匙"）
 * - 道具存储（ItemStore）：管理所有道具定义和实例
 *
 * 道具类型：
 * - consumable: 消耗品（如药水、食物）
 * - equipment: 装备（如武器、防具）
 * - key_item: 关键物品（如钥匙、任务物品）
 * - material: 材料（如矿石、布料）
 * - other: 其他类型
 *
 * 道具交互：
 * - 给予：将道具添加到世界状态或角色背包
 * - 移除：从世界状态或角色背包移除道具
 * - 使用：触发道具效果（如恢复生命、解锁门）
 *
 * 对应 WBS：P2-WE-03（物品系统）
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
