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
 * 解析结果
 */
export type ParsedInput = ParsedCommand | ParsedDialogue | ParsedInvalid;

/**
 * 输入解析器
 * 解析用户输入，分类为指令型或对话型
 */
@injectable()
export class InputParser {
  private characterNames: Map<string, string> = new Map();

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

    // 尝试解析为对话型
    const dialogueResult = this.parseDialogue(trimmed);
    if (dialogueResult) {
      return dialogueResult;
    }

    // 尝试解析为指令型
    const commandResult = this.parseCommand(trimmed);
    if (commandResult) {
      return commandResult;
    }

    return { type: InputType.Invalid, reason: '无法识别的输入格式' };
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
    // 匹配模式：让[人物][动作] 或 命令[人物][动作]
    const patterns = [
      /^让(.+?)去?(.+)$/,
      /^命令(.+?)去?(.+)$/,
      /^指示(.+?)去?(.+)$/,
      /^(.+?)去(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        const characterName = match[1].trim();
        const action = match[2].trim();
        const characterId = this.findCharacterId(characterName);

        if (characterId && action) {
          return {
            type: InputType.Command,
            targetCharacterId: characterId,
            action,
          };
        }
      }
    }

    return null;
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
}
