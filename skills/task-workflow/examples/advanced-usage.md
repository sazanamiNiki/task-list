# 高度な使用例

## 複雑なワークフローの管理

### マルチプロジェクト並行開発

複数のプロジェクトを同時に進行する場合の設定例:

```bash
# tmuxセッションを作成
tmux new-session -s dev-workspace -d

# メインプロジェクト
tmux send-keys -t dev-workspace:0 'cd /path/to/task-list && SESSION=main-project npm start' C-m

# ウィンドウを分割してサブプロジェクト
tmux split-window -h -t dev-workspace:0
tmux send-keys -t dev-workspace:0.1 'cd /path/to/task-list && SESSION=sub-project npm start' C-m

# さらに分割してバグ追跡
tmux split-window -v -t dev-workspace:0.1
tmux send-keys -t dev-workspace:0.2 'cd /path/to/task-list && SESSION=bugs npm start' C-m

# 作業用ペインを選択
tmux select-pane -t dev-workspace:0.0

# アタッチ
tmux attach -t dev-workspace
```

レイアウト:
```
+----------------------+------------+
|                      |   main     |
|                      |  project   |
|                      |            |
|   作業エリア          +------------+
|   (Claude Code      |    sub     |
|    + エディタ)        |  project   |
|                      |            |
|                      +------------+
|                      |    bugs    |
+----------------------+------------+
```

### チーム開発での活用

**シナリオ**: フロントエンド、バックエンド、インフラのタスクを分離

```bash
# Claude Codeで各セッションを初期化
"frontendセッションに以下を追加: UI設計, コンポーネント実装, スタイリング"
"backendセッションに以下を追加: API設計, データベース設計, 認証実装"
"infraセッションに以下を追加: Docker設定, CI/CD構築, デプロイ自動化"

# 3つのTUIを並べて監視
SESSION=frontend npm start  # ターミナル1
SESSION=backend npm start   # ターミナル2
SESSION=infra npm start     # ターミナル3
```

各担当者は自分のセッションのタスクを更新:
```
"frontendセッションのタスク1をin_progressに"
"backendセッションのタスク2をdoneに"
```

## スクリプト連携

### タスク自動追加スクリプト

**create-sprint-tasks.sh**:
```bash
#!/bin/bash

SESSION_ID="sprint-$(date +%Y%m%d)"

# タスクリストをJSONで定義
TASKS='[
  "スプリント計画",
  "ユーザーストーリー作成",
  "設計レビュー",
  "実装",
  "テスト",
  "デモ準備",
  "レトロスペクティブ"
]'

# Node.jsスクリプトでタスクを追加
node -e "
import('./dist/mcp/storage.js').then(storage => {
  const tasks = $TASKS;
  storage.addTasks('$SESSION_ID', tasks);
  console.log('✓ スプリントタスクを作成しました: $SESSION_ID');
});
"

# TUIを起動
SESSION=$SESSION_ID npm start
```

### Git フック連携

**post-commit**:
```bash
#!/bin/bash

# コミット後に自動的にタスクを更新
BRANCH=$(git branch --show-current)
COMMIT_MSG=$(git log -1 --pretty=%B)

# コミットメッセージからタスクIDを抽出（例: "#task-3"）
if [[ $COMMIT_MSG =~ \#task-([0-9]+) ]]; then
  TASK_ID=${BASH_REMATCH[1]}

  node -e "
  import('./dist/mcp/storage.js').then(storage => {
    storage.updateTask('default', $TASK_ID, 'check');
    console.log('✓ タスク $TASK_ID をレビュー待ちに更新しました');
  });
  "
fi
```

使用例:
```bash
git commit -m "feat: ログイン機能を実装 #task-5"
# → 自動的にタスク5が"check"ステータスに
```

### CI/CD連携

**GitHub Actions例**:
```yaml
name: Update Task on Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy
        run: ./deploy.sh

      - name: Update Task
        run: |
          cd /path/to/task-list
          npm install
          npm run build
          node -e "
          import('./dist/mcp/storage.js').then(storage => {
            storage.updateTask('production', 1, 'done');
            console.log('✓ デプロイタスクを完了に更新');
          });
          "
```

## カスタムステータスの追加

`src/types.ts`を拡張:

```typescript
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'check'
  | 'done'
  | 'error'
  | 'blocked'      // 新規: ブロック中
  | 'on_hold';     // 新規: 保留中
```

`config.json`に対応する表示設定を追加:

```json
{
  "statusDisplay": {
    "blocked": {
      "icon": "🚫",
      "iconColor": "yellow",
      "textColor": "yellow",
      "strikethrough": false,
      "useSpinner": false
    },
    "on_hold": {
      "icon": "⏸",
      "iconColor": "cyan",
      "textColor": "cyan",
      "strikethrough": false,
      "useSpinner": false
    }
  }
}
```

再ビルド:
```bash
npm run build
```

## データエクスポート/インポート

### タスクのバックアップ

```bash
# 日次バックアップスクリプト
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
cp tasks.json $BACKUP_DIR/tasks-$(date +%H%M%S).json
echo "✓ バックアップ完了: $BACKUP_DIR"
```

### 他のツールへのエクスポート

**Markdown形式でエクスポート**:
```javascript
// export-to-markdown.js
import { readFileSync } from 'fs';

const tasks = JSON.parse(readFileSync('tasks.json', 'utf-8'));

for (const [sessionId, taskList] of Object.entries(tasks)) {
  console.log(`## ${sessionId}\n`);

  taskList.forEach(task => {
    const checkbox = task.status === 'done' ? '[x]' : '[ ]';
    console.log(`${checkbox} ${task.title} (${task.status})`);
  });

  console.log('');
}
```

実行:
```bash
node export-to-markdown.js > tasks.md
```

出力例:
```markdown
## default

[ ] データベース設計 (pending)
[x] API実装 (done)
[ ] テスト作成 (in_progress)

## project-a

[ ] 機能A (pending)
[ ] 機能B (pending)
```

## パフォーマンス最適化

### 大量のタスクがある場合

tasks.jsonが大きくなった場合のアーカイブ処理:

```javascript
// archive-done-tasks.js
import { readSessionTasks, writeSessionTasks } from './dist/mcp/storage.js';
import { writeFileSync } from 'fs';

const allSessions = readSessionTasks();
const archive = {};

for (const [sessionId, tasks] of Object.entries(allSessions)) {
  const doneTasks = tasks.filter(t => t.status === 'done');
  const activeTasks = tasks.filter(t => t.status !== 'done');

  if (doneTasks.length > 0) {
    archive[sessionId] = doneTasks;
    allSessions[sessionId] = activeTasks;
  }
}

// アーカイブを保存
const timestamp = new Date().toISOString().split('T')[0];
writeFileSync(
  `archive-${timestamp}.json`,
  JSON.stringify(archive, null, 2)
);

// アクティブなタスクのみ残す
writeSessionTasks(allSessions);

console.log('✓ 完了タスクをアーカイブしました');
```

## モニタリングとログ

### タスク変更履歴の記録

```javascript
// task-logger.js
import chokidar from 'chokidar';
import { readFileSync, appendFileSync } from 'fs';

const watcher = chokidar.watch('tasks.json', {
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100,
  },
});

watcher.on('change', () => {
  const timestamp = new Date().toISOString();
  const tasks = JSON.parse(readFileSync('tasks.json', 'utf-8'));

  const log = {
    timestamp,
    snapshot: tasks
  };

  appendFileSync(
    'task-history.jsonl',
    JSON.stringify(log) + '\n'
  );
});

console.log('📝 タスク変更の記録を開始しました...');
```

### ダッシュボード生成

```javascript
// generate-dashboard.js
import { readSessionTasks } from './dist/mcp/storage.js';

const sessions = readSessionTasks();
const stats = {};

for (const [sessionId, tasks] of Object.entries(sessions)) {
  const statusCount = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  stats[sessionId] = {
    total: tasks.length,
    ...statusCount,
    completion: tasks.filter(t => t.status === 'done').length / tasks.length * 100
  };
}

console.log('📊 プロジェクトダッシュボード\n');
console.log('セッション | 合計 | 進行中 | 完了 | エラー | 完了率');
console.log('---------|-----|--------|------|--------|-------');

for (const [sessionId, stat] of Object.entries(stats)) {
  console.log(
    `${sessionId.padEnd(9)}| ` +
    `${(stat.total || 0).toString().padEnd(4)}| ` +
    `${(stat.in_progress || 0).toString().padEnd(7)}| ` +
    `${(stat.done || 0).toString().padEnd(5)}| ` +
    `${(stat.error || 0).toString().padEnd(7)}| ` +
    `${stat.completion.toFixed(1)}%`
  );
}
```

実行:
```bash
node generate-dashboard.js
```

出力例:
```
📊 プロジェクトダッシュボード

セッション | 合計 | 進行中 | 完了 | エラー | 完了率
---------|-----|--------|------|--------|-------
default  | 5   | 2      | 2    | 1      | 40.0%
project-a| 3   | 1      | 2    | 0      | 66.7%
bugs     | 10  | 3      | 5    | 2      | 50.0%
```

## トラブルシューティング

### デバッグモード

環境変数でデバッグ情報を出力:

```bash
DEBUG=true SESSION=default npm start
```

`src/tui/index.ts`を拡張:
```typescript
const DEBUG = process.env.DEBUG === 'true';

function loadTasks() {
  try {
    // ... existing code ...
    if (DEBUG) {
      console.error(`[DEBUG] Loaded ${tasks.length} tasks for ${SESSION_ID}`);
    }
  } catch (error) {
    if (DEBUG) {
      console.error('[DEBUG] Error loading tasks:', error);
    }
  }
}
```

### パフォーマンス計測

```javascript
// benchmark.js
import { performance } from 'perf_hooks';
import { readSessionTasks, addTasks } from './dist/mcp/storage.js';

const iterations = 1000;

// 読み込みベンチマーク
const readStart = performance.now();
for (let i = 0; i < iterations; i++) {
  readSessionTasks();
}
const readEnd = performance.now();
console.log(`読み込み: ${((readEnd - readStart) / iterations).toFixed(3)}ms/回`);

// 書き込みベンチマーク
const writeStart = performance.now();
for (let i = 0; i < iterations; i++) {
  addTasks(`bench-${i}`, ['test task']);
}
const writeEnd = performance.now();
console.log(`書き込み: ${((writeEnd - writeStart) / iterations).toFixed(3)}ms/回`);
```
