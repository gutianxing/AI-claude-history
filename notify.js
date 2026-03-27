#!/usr/bin/env node
// 任务完成通知脚本
// 用法: node notify.js "标题" "消息" [类型]
// 类型: success (默认) | error | warning | info

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const title = process.argv[2] || '🎉 任务完成';
const message = process.argv[3] || 'Claude Code 任务已完成，请返回查看。';
const type = process.argv[4] || 'success';

// 获取项目路径 - 优先从环境变量，其次从 cwd
// Claude Code hook 可能设置 CLAUDE_PROJECT_DIR 或其他变量
let projectPath = process.env.CLAUDE_PROJECT_DIR || process.env.CLAUDE_CWD || process.cwd();

// 如果是从 hook 调用且 cwd 不对，尝试从其他环境变量获取
if (projectPath === process.env.HOME || projectPath === process.env.USERPROFILE) {
  // cwd 是用户主目录，说明可能是 hook 调用
  // 尝试从 CLAUDE_CONFIG_DIR 或其他变量推断
  const possibleProjectDir = process.env.PWD || process.env.OLDPWD;
  if (possibleProjectDir && possibleProjectDir !== process.env.HOME && possibleProjectDir !== process.env.USERPROFILE) {
    projectPath = possibleProjectDir;
  }
}

const projectName = path.basename(projectPath);

const data = JSON.stringify({
  title,
  message,
  type,
  projectPath,
  projectName
});

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/notify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      if (result.success) {
        console.log(`✅ 通知已发送到 ${result.sentTo || 0} 个客户端`);
        console.log(`   项目: ${projectName}`);
        console.log(`   路径: ${projectPath}`);
      } else {
        console.error('❌ 发送失败:', result.error);
      }
    } catch (e) {
      console.error('❌ 解析响应失败:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 请求失败:', e.message);
  // 静默失败，不影响主流程
});
req.write(data);
req.end();