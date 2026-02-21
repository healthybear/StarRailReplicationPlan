import 'reflect-metadata';
import { PlotService } from '../plot.service.js';
import type { PlotGraphConfig, WorldState } from '@star-rail/types';
import { createDefaultWorldState } from '@star-rail/types';

function makeGraph(): PlotGraphConfig {
  return {
    version: '1.0',
    startNodeId: 'node-1',
    nodes: {
      'node-1': {
        id: 'node-1',
        name: '开始',
        branches: [
          {
            id: 'branch-a',
            name: '选择A',
            outcomes: [{ type: 'custom', description: '结果A' }],
            nextNodeId: 'node-2',
          },
          {
            id: 'branch-b',
            name: '选择B',
            outcomes: [{ type: 'custom', description: '结果B' }],
            nextNodeId: 'node-3',
          },
        ],
      },
      'node-2': {
        id: 'node-2',
        name: '路径A',
        branches: [],
        isTerminal: true,
      },
      'node-3': {
        id: 'node-3',
        name: '路径B',
        branches: [
          {
            id: 'branch-c',
            name: '继续',
            outcomes: [],
          },
        ],
      },
    },
  };
}

function makeWorldState(nodeId?: string): WorldState {
  const ws = createDefaultWorldState('scene-1');
  if (nodeId) ws.currentPlotNodeId = nodeId;
  return ws;
}

describe('PlotService', () => {
  let service: PlotService;

  beforeEach(() => {
    service = new PlotService();
  });

  describe('loadPlotGraph / getNode / getStartNodeId', () => {
    it('加载剧情图后可获取节点', () => {
      service.loadPlotGraph(makeGraph());
      expect(service.getNode('node-1')).toBeDefined();
      expect(service.getNode('node-1')!.name).toBe('开始');
    });

    it('getStartNodeId 返回起始节点 ID', () => {
      service.loadPlotGraph(makeGraph());
      expect(service.getStartNodeId()).toBe('node-1');
    });

    it('getNode 不存在时返回 undefined', () => {
      service.loadPlotGraph(makeGraph());
      expect(service.getNode('nonexistent')).toBeUndefined();
    });

    it('重新加载剧情图会清除旧数据', () => {
      service.loadPlotGraph(makeGraph());
      service.loadPlotGraph({
        version: '2.0',
        startNodeId: 'n1',
        nodes: { n1: { id: 'n1', name: 'X', branches: [] } },
      });
      expect(service.getNode('node-1')).toBeUndefined();
      expect(service.getNode('n1')).toBeDefined();
    });
  });

  describe('getAvailableBranches', () => {
    beforeEach(() => service.loadPlotGraph(makeGraph()));

    it('返回当前节点的分支列表', () => {
      const ws = makeWorldState('node-1');
      const branches = service.getAvailableBranches(ws);
      expect(branches).toHaveLength(2);
      expect(branches.map((b) => b.id)).toEqual(['branch-a', 'branch-b']);
    });

    it('无当前节点时返回空数组', () => {
      const ws = makeWorldState();
      expect(service.getAvailableBranches(ws)).toEqual([]);
    });

    it('节点不存在时返回空数组', () => {
      const ws = makeWorldState('nonexistent');
      expect(service.getAvailableBranches(ws)).toEqual([]);
    });
  });

  describe('advanceBranch', () => {
    beforeEach(() => service.loadPlotGraph(makeGraph()));

    it('推进分支并更新当前节点', () => {
      const ws = makeWorldState('node-1');
      const branch = service.advanceBranch(ws, 'branch-a');
      expect(branch).toBeDefined();
      expect(branch!.id).toBe('branch-a');
      expect(ws.currentPlotNodeId).toBe('node-2');
    });

    it('推进后更新 availableBranchIds', () => {
      const ws = makeWorldState('node-1');
      service.advanceBranch(ws, 'branch-b');
      expect(ws.availableBranchIds).toEqual(['branch-c']);
    });

    it('分支无 nextNodeId 时不更新节点', () => {
      const ws = makeWorldState('node-3');
      service.advanceBranch(ws, 'branch-c');
      expect(ws.currentPlotNodeId).toBe('node-3');
    });

    it('分支不存在时返回 undefined', () => {
      const ws = makeWorldState('node-1');
      expect(service.advanceBranch(ws, 'nonexistent')).toBeUndefined();
    });

    it('无当前节点时返回 undefined', () => {
      const ws = makeWorldState();
      expect(service.advanceBranch(ws, 'branch-a')).toBeUndefined();
    });
  });

  describe('setCurrentNode', () => {
    beforeEach(() => service.loadPlotGraph(makeGraph()));

    it('设置当前节点并更新可用分支', () => {
      const ws = makeWorldState();
      service.setCurrentNode(ws, 'node-1');
      expect(ws.currentPlotNodeId).toBe('node-1');
      expect(ws.availableBranchIds).toEqual(['branch-a', 'branch-b']);
    });

    it('节点不存在时 availableBranchIds 为空数组', () => {
      const ws = makeWorldState();
      service.setCurrentNode(ws, 'nonexistent');
      expect(ws.availableBranchIds).toEqual([]);
    });
  });

  describe('isTerminal', () => {
    beforeEach(() => service.loadPlotGraph(makeGraph()));

    it('终止节点返回 true', () => {
      const ws = makeWorldState('node-2');
      expect(service.isTerminal(ws)).toBe(true);
    });

    it('非终止节点返回 false', () => {
      const ws = makeWorldState('node-1');
      expect(service.isTerminal(ws)).toBe(false);
    });

    it('无当前节点时返回 false', () => {
      const ws = makeWorldState();
      expect(service.isTerminal(ws)).toBe(false);
    });
  });

  describe('clear', () => {
    it('清除剧情图数据', () => {
      service.loadPlotGraph(makeGraph());
      service.clear();
      expect(service.getNode('node-1')).toBeUndefined();
      expect(service.getStartNodeId()).toBeUndefined();
    });
  });
});
