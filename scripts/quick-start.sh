#!/bin/bash

# 快速启动脚本
# 用于一键构建、创建示例会话并启动游戏

set -e

echo "🚀 星穹铁道剧情复现计划 - 快速启动"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
  echo "⚠️  未找到 .env 文件"
  echo "📝 正在从 .env.example 创建 .env..."
  cp .env.example .env
  echo ""
  echo "⚠️  请编辑 .env 文件，设置你的 API Key："
  echo "   DEEPSEEK_API_KEY=your_api_key_here"
  echo ""
  echo "然后重新运行此脚本"
  exit 1
fi

# 检查是否已设置 API Key
if ! grep -q "DEEPSEEK_API_KEY=sk-" .env && ! grep -q "OPENAI_API_KEY=sk-" .env; then
  echo "⚠️  未检测到有效的 API Key"
  echo "📝 请编辑 .env 文件，设置你的 API Key："
  echo "   DEEPSEEK_API_KEY=your_api_key_here"
  echo ""
  exit 1
fi

# 检查是否已构建
if [ ! -d "packages/cli/dist" ]; then
  echo "🔨 首次运行，正在构建项目..."
  pnpm build
  echo "✅ 构建完成"
  echo ""
fi

# 检查是否已有示例会话
if [ ! -d "data/sessions" ] || [ -z "$(ls -A data/sessions 2>/dev/null)" ]; then
  echo "📦 创建示例会话..."
  pnpm demo
  echo ""
fi

# 启动游戏
echo "🎮 启动游戏..."
echo ""
pnpm start
