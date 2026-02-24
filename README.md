# Task Monitor TUI

Blessedを使用したタスク監視用TUIアプリケーション + MCPサーバー

## 概要

セッション単位でタスクを管理できるTUIアプリケーションとMCPサーバーのセットです。

- **TUIアプリケーション**: ローカルの `tasks.json` ファイルを監視し、セッション別にタスクの進捗状況をリアルタイム表示
- **MCPサーバー**: Claude Codeなどから呼び出せるタスク操作用のツールを提供（タスクの追加、更新、削除）

## 特徴

- **セッション分離**: プロジェクトやコンテキストごとに独立したタスクリストを管理
- **リアルタイム監視**: `tasks.json` ファイルの変更を自動検知
- **リッチなUI**: Blessedによる美しいターミナルUI
- **ステータス別表示**: 5種類のステータスに応じた視覚的な表現（スピナーアニメーション対応）
- **MCPツール**: Claude Codeからタスクの追加、更新、削除が可能
- **自動マイグレーション**: 旧形式（配列）から新形式（セッション対応）へ自動変換
- **堅牢なエラーハンドリング**: 別プロセスからの書き込み中でも安定動作

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# TypeScriptのビルド
npm run build
```

## 使い方

### TUIアプリケーション

```bash
# デフォルトセッション（"default"）で起動
npm start

# 特定のセッションを指定して起動
SESSION=project-a npm start

# または直接実行
node dist/tui/index.js
SESSION=project-b node dist/tui/index.js
```

TUIアプリはカレントディレクトリの `tasks.json` を監視し、指定されたセッションのタスクのみを表示します。

**終了方法**: `Esc`、`q`、または `Ctrl+C`

### MCPサーバー

```bash
# MCPサーバーの起動
npm run mcp

# または直接実行
node dist/mcp/index.js
```

MCPサーバーはstdio経由でModel Context Protocolに準拠した通信を行います。Claude Codeの設定ファイルに登録することで、Claude Code経由でタスク操作が可能になります。

## タスクステータス（デフォルト）

| ステータス | アイコン | 色 | 説明 |
|-----------|---------|-----|------|
| `pending` | ◯ | グレー | 未着手 |
| `in_progress` | ドットアニメーション | イエロー | 実行中 |
| `check` | 👀 | マゼンタ | レビュー待ち |
| `done` | ✔ | グリーン（打ち消し線） | 完了 |
| `error` | ✖ | レッド | エラー発生 |

**注**: ステータスの表示設定は `config.json` でカスタマイズ可能です。

## tasks.json の形式

### セッション対応形式（v1.0.0以降）

```json
{
  "default": [
    {
      "id": 1,
      "title": "タスクのタイトル",
      "status": "in_progress"
    }
  ],
  "project-a": [
    {
      "id": 1,
      "title": "プロジェクトAのタスク",
      "status": "pending"
    }
  ]
}
```

各セッションは独立したタスクリストを持ちます。セッション名は任意の文字列を使用できます。

### 旧形式（配列形式）

```json
[
  {
    "id": 1,
    "title": "タスクのタイトル",
    "status": "in_progress"
  }
]
```

旧形式のファイルが存在する場合、初回起動時に自動的にセッション対応形式（`{ "default": [...] }`）に変換されます。元のファイルは `tasks.json.backup` として保存されます。

## MCPツール

MCPサーバーは以下の3つのツールを提供します：

### add_tasks

指定されたセッションに複数のタスクを一括追加します。

**引数:**
- `sessionId` (string): セッション名
- `titles` (string[]): 追加するタスクのタイトルリスト（最低1つ必要）

**例:**
```json
{
  "sessionId": "project-a",
  "titles": ["新機能の実装", "テストの追加", "ドキュメント作成"]
}
```

追加されたタスクのステータスは自動的に `pending` に設定されます。

### update_task

指定されたタスクのステータスを更新します。

**引数:**
- `sessionId` (string): セッション名
- `id` (number): 更新するタスクのID（正の整数）
- `status` (string): 新しいステータス（`pending`, `in_progress`, `check`, `done`, `error` のいずれか）

**例:**
```json
{
  "sessionId": "project-a",
  "id": 1,
  "status": "in_progress"
}
```

### clear_tasks

指定されたセッションのタスクを削除します。

**引数:**
- `sessionId` (string): セッション名
- `clearAll` (boolean, オプション): `true` の場合は全タスクを削除、`false`（デフォルト）の場合は `done` ステータスのタスクのみ削除

**例:**
```json
{
  "sessionId": "project-a",
  "clearAll": false
}
```

完了タスクのみを削除する場合は `clearAll` を省略するか `false` に設定します。

## 設定ファイル（config.json）

ステータスごとの表示設定を `config.json` でカスタマイズできます。設定ファイルはリアルタイムで監視され、変更が即座に反映されます。

### 設定項目

各ステータスに対して以下の項目を設定できます:

- `icon`: 表示するアイコン文字列
- `iconColor`: アイコンの色（Inkの色名: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`）
- `textColor`: タスクタイトルの色
- `strikethrough`: 打ち消し線を表示するか（`true` / `false`）
- `useSpinner`: アニメーションスピナーを使用するか（`true` / `false`）

### デフォルト設定例

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

### カスタマイズ例

異なる配色やアイコンに変更する場合:

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

## tmux での使用例

```bash
# デフォルトセッションを横分割で表示
tmux split-window -h 'npm start'

# 特定のセッションを縦分割で表示
tmux split-window -v 'SESSION=project-a npm start'

# 複数セッションを同時に監視
tmux split-window -h 'SESSION=project-a npm start'
tmux split-window -v 'SESSION=project-b npm start'
```

## 技術スタック

### TUIアプリケーション
- TypeScript
- Blessed (TUIライブラリ)
- chokidar (ファイル監視)

### MCPサーバー
- TypeScript
- @modelcontextprotocol/sdk (Model Context Protocol SDK)
- Zod (スキーマバリデーション)

## ライセンス

MIT
