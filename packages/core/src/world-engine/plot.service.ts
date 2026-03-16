import { injectable } from 'tsyringe';
import type {
  PlotNode,
  PlotBranch,
  PlotGraphConfig,
  WorldState,
} from '@star-rail/types';

/**
 * 剧情服务 - 剧情图管理与分支推进
 *
 * 职责：
 * 1. 管理剧情图（节点和分支）
 * 2. 加载剧情配置
 * 3. 查询当前可用分支（根据条件过滤）
 * 4. 推进剧情节点
 *
 * 剧情图结构：
 * - 节点（PlotNode）：剧情中的关键点（如章节、场景、选择点）
 * - 分支（PlotBranch）：连接节点的路径（如选择、条件触发）
 * - 起始节点：剧情的入口点
 *
 * 分支条件：
 * - 可以基于世界状态、角色状态、已知信息等条件
 * - 只有满足条件的分支才会显示给玩家
 *
 * 剧情推进：
 * - 玩家选择分支后，更新当前节点
 * - 触发节点相关的事件和效果
 *
 * 对应 WBS：P2-WE-02（剧情图与分支管理）
 */
@injectable()
export class PlotService {
  private plotNodes: Map<string, PlotNode> = new Map();
  private startNodeId: string | undefined;

  /**
   * 加载剧情图配置
   */
  loadPlotGraph(config: PlotGraphConfig): void {
    this.plotNodes.clear();
    this.startNodeId = config.startNodeId;
    for (const [id, node] of Object.entries(config.nodes)) {
      this.plotNodes.set(id, node);
    }
  }

  /**
   * 获取情节节点
   */
  getNode(nodeId: string): PlotNode | undefined {
    return this.plotNodes.get(nodeId);
  }

  /**
   * 获取起始节点 ID
   */
  getStartNodeId(): string | undefined {
    return this.startNodeId;
  }

  /**
   * 获取当前节点的可用分支
   * 根据世界状态过滤满足条件的分支（Phase 2 简化版：返回所有分支）
   */
  getAvailableBranches(worldState: WorldState): PlotBranch[] {
    const nodeId = worldState.currentPlotNodeId;
    if (!nodeId) return [];
    const node = this.plotNodes.get(nodeId);
    if (!node) return [];
    return node.branches;
  }

  /**
   * 推进到指定分支
   * 更新世界状态的当前节点和可用分支 ID
   * @returns 分支结果列表，供调用方处理
   */
  advanceBranch(
    worldState: WorldState,
    branchId: string
  ): PlotBranch | undefined {
    const nodeId = worldState.currentPlotNodeId;
    if (!nodeId) return undefined;

    const node = this.plotNodes.get(nodeId);
    if (!node) return undefined;

    const branch = node.branches.find((b) => b.id === branchId);
    if (!branch) return undefined;

    // 更新当前节点
    if (branch.nextNodeId) {
      worldState.currentPlotNodeId = branch.nextNodeId;
      const nextNode = this.plotNodes.get(branch.nextNodeId);
      worldState.availableBranchIds = nextNode
        ? nextNode.branches.map((b) => b.id)
        : [];
    }

    return branch;
  }

  /**
   * 设置当前节点并更新可用分支
   */
  setCurrentNode(worldState: WorldState, nodeId: string): void {
    worldState.currentPlotNodeId = nodeId;
    const node = this.plotNodes.get(nodeId);
    worldState.availableBranchIds = node ? node.branches.map((b) => b.id) : [];
  }

  /**
   * 当前节点是否为终止节点
   */
  isTerminal(worldState: WorldState): boolean {
    const nodeId = worldState.currentPlotNodeId;
    if (!nodeId) return false;
    const node = this.plotNodes.get(nodeId);
    return node?.isTerminal === true;
  }

  /**
   * 清除剧情图数据
   */
  clear(): void {
    this.plotNodes.clear();
    this.startNodeId = undefined;
  }
}
