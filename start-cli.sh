#!/bin/bash
# 星穹铁道剧情复现计划 CLI 启动脚本
# 确保从项目根目录运行

cd "$(dirname "$0")"
node packages/cli/dist/index.js "$@"
