import { injectable } from 'tsyringe';

/**
 * 输入类型
 */
export enum InputType {
  /** 指令型（如：让三月七去调查） */
  Command = 'command',
  /** 对话型（如：对三月七说"你好"） */
  Dialogue = 'dialogue',
  /** 无意义/无法解析 */
  Invalid = 'invalid',
  /** 越权请求 */
  Unauthorized = 'unauthorized',
}

/**
 * 解析后的指令
 */
export interface ParsedCommand {
  type: InputType.Command;
  targetCharacterId: string;
  action: string;
  parameters?: Record<string, unknown>;
}

/**
 * 解析后的对话
 */
export interface ParsedDialogue {
  type: InputType.Dialogue;
  targetCharacterId: string;
  content: string;
}

/**
 * 无效输入
 */
export interface ParsedInvalid {
  type: InputType.Invalid;
  reason: string;
}

/**
 * 越权请求
 */
export interface ParsedUnauthorized {
  type: InputType.Unauthorized;
  reason: string;
  attemptedAction: string;
  targetCharacterId?: string;
}

/**
 * 解析结果
 */
export type ParsedInput =
  | ParsedCommand
  | ParsedDialogue
  | ParsedInvalid
  | ParsedUnauthorized;

/**
 * 权限配置
 */
export interface PermissionConfig {
  /** 用户可控制的人物 ID 列表 */
  controllableCharacters: string[];
  /** 禁止的动作关键词 */
  forbiddenActions: string[];
  /** 不可变锚点（禁止修改的内容） */
  immutableAnchors: string[];
  /** 是否允许系统级命令 */
  allowSystemCommands: boolean;
}

/**
 * 默认权限配置
 */
export const DEFAULT_PERMISSION_CONFIG: PermissionConfig = {
  controllableCharacters: [],
  forbiddenActions: ['删除', '销毁', '杀死', '重置'],
  immutableAnchors: [],
  allowSystemCommands: false,
};

/**
 * 输入解析器
 * 解析用户输入，分类为指令型或对话型
 */
@injectable()
export class InputParser {
  private characterNames: Map<string, string> = new Map();
  private permissionConfig: PermissionConfig = { ...DEFAULT_PERMISSION_CONFIG };

  /**
   * 设置权限配置
   * @param config 权限配置
   */
  setPermissionConfig(config: Partial<PermissionConfig>): void {
    this.permissionConfig = { ...this.permissionConfig, ...config };
  }

  /**
   * 获取当前权限配置
   */
  getPermissionConfig(): PermissionConfig {
    return { ...this.permissionConfig };
  }

  /**
   * 设置可控制的人物
   * @param characterIds 人物 ID 列表
   */
  setControllableCharacters(characterIds: string[]): void {
    this.permissionConfig.controllableCharacters = [...characterIds];
  }

  /**
   * 添加可控制的人物
   * @param characterId 人物 ID
   */
  addControllableCharacter(characterId: string): void {
    if (!this.permissionConfig.controllableCharacters.includes(characterId)) {
      this.permissionConfig.controllableCharacters.push(characterId);
    }
  }

  /**
   * 添加不可变锚点
   * @param anchor 锚点内容
   */
  addImmutableAnchor(anchor: string): void {
    if (!this.permissionConfig.immutableAnchors.includes(anchor)) {
      this.permissionConfig.immutableAnchors.push(anchor);
    }
  }

  /**
   * 注册人物名称映射
   * @param id 人物 ID
   * @param name 人物名称
   */
  registerCharacter(id: string, name: string): void {
    this.characterNames.set(name.toLowerCase(), id);
  }

  /**
   * 批量注册人物
   */
  registerCharacters(characters: Array<{ id: string; name: string }>): void {
    for (const char of characters) {
      this.registerCharacter(char.id, char.name);
    }
  }

  /**
   * 解析用户输入
   */
  parse(input: string): ParsedInput {
    const trimmed = input.trim();

    if (!trimmed) {
      return { type: InputType.Invalid, reason: '输入为空' };
    }

    // 检查是否包含禁止的动作
    const forbiddenCheck = this.checkForbiddenActions(trimmed);
    if (forbiddenCheck) {
      return forbiddenCheck;
    }

    // 检查是否涉及不可变锚点
    const anchorCheck = this.checkImmutableAnchors(trimmed);
    if (anchorCheck) {
      return anchorCheck;
    }

    // 尝试解析为对话型
    const dialogueResult = this.parseDialogue(trimmed);
    if (dialogueResult) {
      // 检查权限
      const permissionCheck = this.checkPermission(dialogueResult);
      if (permissionCheck) {
        return permissionCheck;
      }
      return dialogueResult;
    }

    // 尝试解析为指令型
    const commandResult = this.parseCommand(trimmed);
    if (commandResult) {
      // 检查权限
      const permissionCheck = this.checkPermission(commandResult);
      if (permissionCheck) {
        return permissionCheck;
      }
      return commandResult;
    }

    return { type: InputType.Invalid, reason: '无法识别的输入格式' };
  }

  /**
   * 检查是否有权限执行该操作
   */
  private checkPermission(
    parsed: ParsedCommand | ParsedDialogue
  ): ParsedUnauthorized | null {
    const { controllableCharacters } = this.permissionConfig;

    // 如果没有设置可控制人物列表，则允许所有操作
    if (controllableCharacters.length === 0) {
      return null;
    }

    // 检查目标人物是否在可控制列表中
    if (!controllableCharacters.includes(parsed.targetCharacterId)) {
      return {
        type: InputType.Unauthorized,
        reason: `无权控制该角色`,
        attemptedAction:
          parsed.type === InputType.Command
            ? (parsed as ParsedCommand).action
            : '对话',
        targetCharacterId: parsed.targetCharacterId,
      };
    }

    return null;
  }

  /**
   * 检查是否包含禁止的动作
   */
  private checkForbiddenActions(input: string): ParsedUnauthorized | null {
    const { forbiddenActions } = this.permissionConfig;

    for (const forbidden of forbiddenActions) {
      if (input.includes(forbidden)) {
        return {
          type: InputType.Unauthorized,
          reason: `禁止的操作: ${forbidden}`,
          attemptedAction: input,
        };
      }
    }

    return null;
  }

  /**
   * 检查是否涉及不可变锚点
   */
  private checkImmutableAnchors(input: string): ParsedUnauthorized | null {
    const { immutableAnchors } = this.permissionConfig;

    for (const anchor of immutableAnchors) {
      if (input.includes(anchor)) {
        return {
          type: InputType.Unauthorized,
          reason: `不可修改的内容: ${anchor}`,
          attemptedAction: input,
        };
      }
    }

    return null;
  }

  private parseDialogue(input: string): ParsedDialogue | null {
    // 匹配模式：对[人物]说"内容" 或 对[人物]说：内容
    const patterns = [
      /^对(.+?)说[：:][""](.+)[""]$/,
      /^对(.+?)说[：:](.+)$/,
      /^跟(.+?)说[：:][""](.+)[""]$/,
      /^跟(.+?)说[：:](.+)$/,
      /^告诉(.+?)[：:][""](.+)[""]$/,
      /^告诉(.+?)[：:](.+)$/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const characterName = match[1].trim();
        const content = match[2].trim();
        const characterId = this.findCharacterId(characterName);

        if (characterId) {
          return {
            type: InputType.Dialogue,
            targetCharacterId: characterId,
            content,
          };
        }
      }
    }

    return null;
  }

  private parseCommand(input: string): ParsedCommand | null {
    // 先尝试使用已注册的人物名称进行精确匹配
    for (const [charName, charId] of this.characterNames) {
      // 匹配模式：让[人物]去[动作] 或 让[人物][动作]
      const patternsWithName = [
        new RegExp(`^让${this.escapeRegex(charName)}去(.+)$`, 'i'),
        new RegExp(`^让${this.escapeRegex(charName)}(.+)$`, 'i'),
        new RegExp(`^命令${this.escapeRegex(charName)}去?(.+)$`, 'i'),
        new RegExp(`^指示${this.escapeRegex(charName)}去?(.+)$`, 'i'),
        new RegExp(`^${this.escapeRegex(charName)}去(.+)$`, 'i'),
      ];

      for (const pattern of patternsWithName) {
        const match = input.match(pattern);
        if (match) {
          const action = match[1].trim();
          if (action) {
            return {
              type: InputType.Command,
              targetCharacterId: charId,
              action,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * 转义正则表达式特殊字符
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private findCharacterId(name: string): string | null {
    // 精确匹配
    const exactMatch = this.characterNames.get(name.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }

    // 部分匹配
    for (const [charName, charId] of this.characterNames) {
      if (
        charName.includes(name.toLowerCase()) ||
        name.toLowerCase().includes(charName)
      ) {
        return charId;
      }
    }

    return null;
  }

  /**
   * 获取已注册的人物列表
   */
  getRegisteredCharacters(): Array<{ id: string; name: string }> {
    const result: Array<{ id: string; name: string }> = [];
    for (const [name, id] of this.characterNames) {
      result.push({ id, name });
    }
    return result;
  }

  /**
   * 清除所有注册的人物
   */
  clearCharacters(): void {
    this.characterNames.clear();
  }
}
