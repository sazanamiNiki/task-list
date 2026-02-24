# Task Workflow Skill

セッション対応のタスク管理TUI + MCPサーバースキル

## 概要

このスキルは、複数のプロジェクトやコンテキストごとにタスクを独立して管理できるシステムを提供します。BlessedベースのTUIアプリケーションでリアルタイムにタスクの進捗状況を確認でき、Claude Code経由でタスクの追加・更新・削除が可能です。

## 主な機能

### 🎯 セッション管理
- プロジェクトやコンテキストごとに独立したタスクリストを管理
- 複数のセッションを同時に監視可能（tmux対応）

### 📊 リアルタイム監視
- `tasks.json`の変更を自動検知
- chokidarによる安定したファイル監視
- スピナーアニメーションによる視覚的フィードバック

### 🎨 柔軟な表示設定
- 5種類のタスクステータス（pending/in_progress/check/done/error）
- `config.json`でアイコン・色・表示スタイルをカスタマイズ可能
- 打ち消し線、スピナーアニメーション対応

### 🔧 MCPツール
- `add_tasks`: セッションに複数タスクを一括追加
- `update_task`: タスクのステータスを更新
- `clear_tasks`: 完了タスクまたは全タスクを削除

### 🔄 自動マイグレーション
- 旧形式（配列）から新形式（セッション対応）へ自動変換
- データ保全のため元ファイルをバックアップ

## インストール

```bash
# 依存パッケージのインストール
npm install

# TypeScriptのビルド
npm run build
```

## 使い方

### TUIアプリケーション

```bash
# デフォルトセッションで起動
npm start

# 特定のセッションで起動
SESSION=my-project npm start

# tmuxで複数セッションを監視
tmux split-window -h 'SESSION=project-a npm start'
tmux split-window -v 'SESSION=project-b npm start'
```

**終了方法**: `Esc`、`q`、または `Ctrl+C`

### MCPサーバー（Claude Code連携）

Claude Codeの設定ファイルに以下を追加:

```json
{
  "mcpServers": {
    "task-workflow": {
      "command": "node",
      "args": ["/path/to/task-list/dist/mcp/index.js"],
      "cwd": "/path/to/task-list"
    }
  }
}
```

## MCPツールの使用例

### タスクの追加

```
Claude Codeから: "defaultセッションに「API実装」「テスト作成」「ドキュメント更新」のタスクを追加して"
```

MCPサーバーが以下を実行:
```json
{
  "tool": "add_tasks",
  "arguments": {
    "sessionId": "default",
    "titles": ["API実装", "テスト作成", "ドキュメント更新"]
  }
}
```

### タスクの更新

```
Claude Codeから: "タスク1をin_progressに更新して"
```

MCPサーバーが以下を実行:
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

### 完了タスクの削除

```
Claude Codeから: "完了したタスクを削除して"
```

MCPサーバーが以下を実行:
```json
{
  "tool": "clear_tasks",
  "arguments": {
    "sessionId": "default",
    "clearAll": false
  }
}
```

## データ構造

### tasks.json（セッション対応形式）

```json
{
  "default": [
    {
      "id": 1,
      "title": "タスクのタイトル",
      "status": "in_progress"
    }
  ],
  "my-project": [
    {
      "id": 1,
      "title": "プロジェクトのタスク",
      "status": "pending"
    }
  ]
}
```

### config.json（表示設定）

```json
{
  "statusDisplay": {
    "pending": {
      "icon": "◯",
      "iconColor": "gray",
      "textColor": "gray",
      "strikethrough": false,
      "useSpinner": false
    },
    "in_progress": {
      "icon": "",
      "iconColor": "yellow",
      "textColor": "white",
      "strikethrough": false,
      "useSpinner": true
    },
    "check": {
      "icon": "👀",
      "iconColor": "magenta",
      "textColor": "magenta",
      "strikethrough": false,
      "useSpinner": false
    },
    "done": {
      "icon": "✔",
      "iconColor": "green",
      "textColor": "gray",
      "strikethrough": true,
      "useSpinner": false
    },
    "error": {
      "icon": "✖",
      "iconColor": "red",
      "textColor": "red",
      "strikethrough": false,
      "useSpinner": false
    }
  }
}
```

## タスクステータス

| ステータス | 用途 | デフォルト表示 |
|-----------|------|--------------|
| `pending` | 未着手 | ◯（グレー） |
| `in_progress` | 実行中 | スピナーアニメーション（イエロー） |
| `check` | レビュー待ち | 👀（マゼンタ） |
| `done` | 完了 | ✔（グリーン、打ち消し線） |
| `error` | エラー発生 | ✖（レッド） |

## ワークフロー例

### 開発プロジェクトの管理

```bash
# ターミナル1: TUIで監視
SESSION=my-feature npm start

# ターミナル2: Claude Codeで作業
# Claude Codeが自動的にタスクを追加・更新
```

### 複数プロジェクトの同時管理

```bash
# tmuxセッションを作成
tmux new-session -s tasks

# プロジェクトAを監視
tmux split-window -h 'SESSION=project-a npm start'

# プロジェクトBを監視
tmux split-window -v 'SESSION=project-b npm start'

# レイアウト調整
tmux select-layout even-horizontal
```

## トラブルシューティング

### TUIが起動しない
- `npm run build`でビルドが完了しているか確認
- `node --version`でNode.js 18以上がインストールされているか確認

### ファイル変更が反映されない
- `tasks.json`の構文が正しいか確認（JSONフォーマッタで検証）
- 別プロセスがファイルをロックしていないか確認

### MCPサーバーに接続できない
- `dist/mcp/index.js`が存在するか確認
- Claude Code設定のパスが正しいか確認
- `npm run mcp`で直接起動してエラーを確認

## 技術スタック

- **TypeScript**: 型安全なコード
- **Blessed**: ターミナルUIライブラリ
- **chokidar**: クロスプラットフォームファイル監視
- **@modelcontextprotocol/sdk**: MCP通信
- **Zod**: スキーマバリデーション

## ライセンス

MIT

## 貢献

Issue、Pull Requestを歓迎します。

## リンク

- Repository: https://github.com/sazanamiNiki/task-list
