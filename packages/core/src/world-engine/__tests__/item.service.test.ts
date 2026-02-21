import 'reflect-metadata';
import { ItemService } from '../item.service.js';
import type { Item, WorldState } from '@star-rail/types';
import { createDefaultWorldState } from '@star-rail/types';

function makeItem(overrides?: Partial<Item>): Item {
  return {
    id: 'sword-01',
    name: '铁剑',
    type: 'weapon',
    description: '普通铁剑',
    ...overrides,
  };
}

function makeWorldState(): WorldState {
  return createDefaultWorldState('scene-1');
}

describe('ItemService', () => {
  let service: ItemService;

  beforeEach(() => {
    service = new ItemService();
  });

  describe('registerItem / getItem / getAllItems', () => {
    it('注册并获取道具定义', () => {
      const item = makeItem();
      service.registerItem(item);
      expect(service.getItem('sword-01')).toEqual(item);
    });

    it('getItem 不存在时返回 undefined', () => {
      expect(service.getItem('nonexistent')).toBeUndefined();
    });

    it('getAllItems 返回所有已注册道具', () => {
      service.registerItem(makeItem({ id: 'i1', name: 'A' }));
      service.registerItem(makeItem({ id: 'i2', name: 'B' }));
      expect(service.getAllItems()).toHaveLength(2);
    });
  });

  describe('giveItem / removeItem', () => {
    it('giveItem 添加道具实例到世界状态', () => {
      const ws = makeWorldState();
      const instanceId = service.giveItem(ws, 'sword-01', 'char-1');
      expect(ws.worldItems).toBeDefined();
      expect(ws.worldItems![instanceId]).toMatchObject({
        itemId: 'sword-01',
        ownerId: 'char-1',
        quantity: 1,
      });
    });

    it('giveItem 支持自定义数量', () => {
      const ws = makeWorldState();
      const instanceId = service.giveItem(ws, 'potion', 'char-1', 5);
      expect(ws.worldItems![instanceId].quantity).toBe(5);
    });

    it('giveItem 世界状态无 worldItems 时自动初始化', () => {
      const ws = makeWorldState();
      expect(ws.worldItems).toBeUndefined();
      service.giveItem(ws, 'sword-01', 'char-1');
      expect(ws.worldItems).toBeDefined();
    });

    it('removeItem 移除道具实例', () => {
      const ws = makeWorldState();
      const instanceId = service.giveItem(ws, 'sword-01', 'char-1');
      const result = service.removeItem(ws, instanceId);
      expect(result).toBe(true);
      expect(ws.worldItems![instanceId]).toBeUndefined();
    });

    it('removeItem 实例不存在时返回 false', () => {
      const ws = makeWorldState();
      expect(service.removeItem(ws, 'nonexistent')).toBe(false);
    });
  });

  describe('getOwnerItems', () => {
    it('返回指定持有者的道具实例', () => {
      service.registerItem(makeItem());
      const ws = makeWorldState();
      service.giveItem(ws, 'sword-01', 'char-1');
      service.giveItem(ws, 'sword-01', 'char-2');
      const items = service.getOwnerItems(ws, 'char-1');
      expect(items).toHaveLength(1);
      expect(items[0].instance.ownerId).toBe('char-1');
      expect(items[0].item?.id).toBe('sword-01');
    });

    it('无 worldItems 时返回空数组', () => {
      const ws = makeWorldState();
      expect(service.getOwnerItems(ws, 'char-1')).toEqual([]);
    });
  });

  describe('transferItem', () => {
    it('转移道具所有权', () => {
      const ws = makeWorldState();
      const instanceId = service.giveItem(ws, 'sword-01', 'char-1');
      const result = service.transferItem(ws, instanceId, 'char-2');
      expect(result).toBe(true);
      expect(ws.worldItems![instanceId].ownerId).toBe('char-2');
    });

    it('实例不存在时返回 false', () => {
      const ws = makeWorldState();
      expect(service.transferItem(ws, 'nonexistent', 'char-2')).toBe(false);
    });
  });

  describe('clearDefinitions', () => {
    it('清除道具定义', () => {
      service.registerItem(makeItem());
      service.clearDefinitions();
      expect(service.getAllItems()).toHaveLength(0);
    });
  });
});
