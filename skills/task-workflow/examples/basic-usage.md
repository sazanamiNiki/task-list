# 基本的な使用例

## セットアップ

### 1. インストール

```bash
cd /path/to/task-list
npm install
npm run build
```

### 2. Claude Code設定

`~/.config/claude-code/config.json`（または適切な設定ファイル）に追加:

```json
{
  "mcpServers": {
    "task-workflow": {
      "command": "node",
      "args": ["/absolute/path/to/task-list/dist/mcp/index.js"],
      "cwd": "/absolute/path/to/task-list"
    }
  }
}
```

### 3. TUI起動

```bash
# デフォルトセッション
npm start

# または特定のセッション
SESSION=my-project npm start
```

## 使用例

### 例1: 新規プロジェクトのタスク管理

**ステップ1**: タスクを追加

Claude Codeに以下のように指示:
```
defaultセッションに以下のタスクを追加してください:
- データベース設計
- API実装
- フロントエンド開発
- テスト作成
```

MCPツールが実行される:
```json
{
  "tool": "add_tasks",
  "arguments": {
    "sessionId": "default",
    "titles": [
      "データベース設計",
      "API実装",
      "フロントエンド開発",
      "テスト作成"
    ]
  }
}
```

**ステップ2**: TUIで確認

TUIアプリケーションに即座に反映される:
```
⚡ Task Manager [default]

◯ データベース設計
◯ API実装
◯ フロントエンド開発
◯ テスト作成
```

**ステップ3**: タスクを開始

Claude Codeに:
```
タスク1（データベース設計）をin_progressにしてください
```

MCPツールが実行:
```json
{
  "tool": "update_task",
  "arguments": {
    "sessionId": "default",
    "id": 1,
    "status": "in_progress"
  }
}
```

TUIの表示が更新される:
```
⚡ Task Manager [default]

⠋ データベース設計  ← スピナーアニメーション
◯ API実装
◯ フロントエンド開発
◯ テスト作成
```

**ステップ4**: タスク完了

```
タスク1をdoneに更新してください
```

TUIの表示:
```
⚡ Task Manager [default]

✔ データベース設計  ← 打ち消し線、グリーン
◯ API実装
◯ フロントエンド開発
◯ テスト作成
```

### 例2: 複数プロジェクトの同時管理

**ターミナル1**: プロジェクトAの監視
```bash
SESSION=project-a npm start
```

**ターミナル2**: プロジェクトBの監視
```bash
SESSION=project-b npm start
```

**Claude Code**: プロジェクトごとにタスクを管理
```
project-aセッションに「認証機能」「ログイン画面」のタスクを追加
```

```
project-bセッションに「API連携」「エラーハンドリング」のタスクを追加
```

各TUIは独立してそれぞれのセッションのタスクのみを表示します。

### 例3: tmuxを使った効率的な監視

```bash
# 新しいtmuxセッションを作成
tmux new-session -s task-monitor

# ウィンドウを水平分割してproject-aを表示
tmux split-window -h 'cd /path/to/task-list && SESSION=project-a npm start'

# 右側をさらに垂直分割してproject-bを表示
tmux select-pane -t 1
tmux split-window -v 'cd /path/to/task-list && SESSION=project-b npm start'

# 左側でClaude Codeを使って作業
tmux select-pane -t 0
```

レイアウト:
```
+------------------+------------------+
|                  | project-a TUI    |
|                  |                  |
|  作業スペース      +------------------+
|  (Claude Code)   | project-b TUI    |
|                  |                  |
+------------------+------------------+
```

### 例4: ステータスの使い分け

```
# タスクを追加
add_tasks: ["バグ調査", "修正実装", "テスト", "レビュー依頼"]

# 作業開始
update_task: id=1, status="in_progress"  → ⠋ バグ調査

# 完了してレビュー待ち
update_task: id=1, status="check"        → 👀 バグ調査

# レビュー承認後
update_task: id=1, status="done"         → ✔ バグ調査

# もしエラーが発生したら
update_task: id=2, status="error"        → ✖ 修正実装
```

### 例5: 完了タスクのクリーンアップ

週の終わりに完了タスクを整理:

```
defaultセッションの完了タスクを削除してください
```

MCPツールが実行:
```json
{
  "tool": "clear_tasks",
  "arguments": {
    "sessionId": "default",
    "clearAll": false
  }
}
```

`done`ステータスのタスクのみが削除され、TUIがリフレッシュされます。

### 例6: プロジェクトのリセット

プロジェクト完了後、全タスクをクリア:

```
project-aセッションの全タスクを削除してください
```

MCPツールが実行:
```json
{
  "tool": "clear_tasks",
  "arguments": {
    "sessionId": "project-a",
    "clearAll": true
  }
}
```

## ワークフロー統合のヒント

### 1. 開発サイクルとの統合

```
朝の作業開始時:
"今日のタスクを追加: コードレビュー、機能実装、ドキュメント更新"

作業中:
"タスク2をin_progressに"

休憩前:
"タスク2をcheckに"（レビュー待ち）

終業時:
"完了タスクを削除"
```

### 2. スプリント管理

```
スプリント開始:
"sprint-1セッションにバックログのタスクを追加"

デイリースタンドアップ前:
TUIで進捗を一目で確認

スプリント終了:
"sprint-1セッションの完了タスクを削除"
```

### 3. バグトラッキング

```
"bugsセッションに新しいバグを追加: ログイン失敗、画面崩れ"
"バグ1をin_progressに"
"バグ1をdone、バグ2をerrorに"（再現できない場合）
```

## カスタマイズ例

### 独自の配色を設定

`config.json`を編集:

```json
{
  "statusDisplay": {
    "pending": {
      "icon": "⏸",
      "iconColor": "white",
      "textColor": "white",
      "strikethrough": false,
      "useSpinner": false
    },
    "in_progress": {
      "icon": "▶",
      "iconColor": "cyan",
      "textColor": "cyan",
      "strikethrough": false,
      "useSpinner": false
    }
  }
}
```

設定ファイルはリアルタイムで監視され、変更が即座にTUIに反映されます。
