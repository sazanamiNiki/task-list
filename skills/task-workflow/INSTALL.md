# Task Workflow スキルのインストールガイド

## 必要要件

- **Node.js**: 18.0.0以上
- **npm**: 8.0.0以上
- **Claude Code**: 最新版（MCP対応）
- **ターミナル**: UTF-8対応（絵文字表示のため）

## インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/sazanamiNiki/task-list.git
cd task-list
```

### 2. 依存パッケージのインストール

```bash
npm install
```

インストールされるパッケージ:
- `@modelcontextprotocol/sdk`: MCP通信用SDK
- `blessed`: ターミナルUIライブラリ
- `chokidar`: ファイル監視ライブラリ
- `zod`: スキーマバリデーション

### 3. TypeScriptのビルド

```bash
npm run build
```

`dist/`ディレクトリに以下が生成されます:
```
dist/
├── types.js
├── mcp/
│   ├── index.js      # MCPサーバー
│   ├── storage.js    # ストレージ管理
│   └── tools.js      # ツールハンドラー
└── tui/
    └── index.js      # TUIアプリケーション
```

### 4. 動作確認

TUIアプリケーションを起動:
```bash
npm start
```

以下のような画面が表示されればOK:
```
┌─────────────────────────────────┐
│ ⚡ Task Manager [default]        │
│                                 │
│ No tasks                        │
│                                 │
└─────────────────────────────────┘
```

終了: `Esc`、`q`、または `Ctrl+C`

## Claude Code連携の設定

### macOS / Linux

Claude Codeの設定ファイルを編集:

```bash
# 設定ファイルの場所を確認
# 通常は以下のいずれか:
# ~/.config/claude-code/config.json
# ~/.claude-code/config.json

# エディタで開く
nano ~/.config/claude-code/config.json
```

以下を追加（パスは実際のインストール先に置き換え）:

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

**重要**: パスは絶対パスで指定してください。

### Windows

PowerShellで設定:

```powershell
# 設定ファイルの場所
# 通常: %USERPROFILE%\.config\claude-code\config.json

notepad $env:USERPROFILE\.config\claude-code\config.json
```

設定内容（Windowsの場合）:
```json
{
  "mcpServers": {
    "task-workflow": {
      "command": "node",
      "args": ["C:\\path\\to\\task-list\\dist\\mcp\\index.js"],
      "cwd": "C:\\path\\to\\task-list"
    }
  }
}
```

### 設定の確認

Claude Codeを再起動後、以下のコマンドで確認:

```
MCPサーバーのリストを表示してください
```

`task-workflow`が表示されればOK。

利用可能なツール:
- `add_tasks`
- `update_task`
- `clear_tasks`

## 初期設定

### config.jsonの作成（オプション）

デフォルト設定をカスタマイズする場合:

```bash
cd /path/to/task-list
cp skills/task-workflow/mcp-config.sample.json config.json
```

`config.json`を編集して好みの配色やアイコンに変更できます。

### tasks.jsonの初期化

初回起動時に自動的に作成されますが、手動で作成する場合:

```bash
echo '{}' > tasks.json
```

## アップグレード

### 最新版へのアップデート

```bash
cd /path/to/task-list
git pull origin main
npm install
npm run build
```

### バージョン確認

```bash
npm run mcp -- --version
# または
cat package.json | grep version
```

## アンインストール

### 1. Claude Code設定から削除

`config.json`から`task-workflow`エントリを削除。

### 2. ファイルの削除

```bash
cd /path/to/task-list/..
rm -rf task-list
```

### 3. データのバックアップ（オプション）

アンインストール前にタスクデータを保存:

```bash
cd /path/to/task-list
cp tasks.json ~/task-list-backup-$(date +%Y%m%d).json
```

## トラブルシューティング

### ビルドエラー

```
Error: Cannot find module 'typescript'
```

**解決策**:
```bash
npm install --save-dev typescript
npm run build
```

### MCPサーバーが起動しない

```
Error: Cannot find module './dist/mcp/index.js'
```

**解決策**:
```bash
npm run build
# または
npm install && npm run build
```

### TUIが文字化けする

**原因**: ターミナルがUTF-8をサポートしていない

**解決策**:
```bash
# macOS/Linux
export LANG=en_US.UTF-8

# または~/.bashrc, ~/.zshrcに追記
echo 'export LANG=en_US.UTF-8' >> ~/.zshrc
```

### ファイル変更が反映されない

**原因**: chokidarがファイル変更を検知できていない

**解決策**:
1. tasks.jsonの構文を確認
2. ファイルパーミッションを確認
3. 別プロセスがファイルをロックしていないか確認

```bash
# ファイルパーミッション確認
ls -la tasks.json

# 必要に応じて修正
chmod 644 tasks.json
```

### パフォーマンスが遅い

**原因**: tasks.jsonが大きすぎる

**解決策**:
```bash
# 完了タスクをアーカイブ
node skills/task-workflow/examples/archive-done-tasks.js
```

## 開発者向け

### ソースからのビルド

```bash
git clone https://github.com/sazanamiNiki/task-list.git
cd task-list
npm install
npm run build

# ウォッチモード（開発用）
npm run watch
```

### テスト実行

```bash
# 単体テスト
npm test

# E2Eテスト
npm run test:e2e
```

### コントリビューション

1. フォークする
2. フィーチャーブランチを作成: `git checkout -b feature/amazing-feature`
3. コミット: `git commit -m 'Add amazing feature'`
4. プッシュ: `git push origin feature/amazing-feature`
5. Pull Requestを作成

## サポート

### 問題報告

GitHubのIssuesで報告:
https://github.com/sazanamiNiki/task-list/issues

### ドキュメント

- [README](../../README.md)
- [基本的な使用例](./examples/basic-usage.md)
- [高度な使用例](./examples/advanced-usage.md)

### コミュニティ

- GitHub Discussions: プロジェクトのDiscussionsセクション
- Twitter: プロジェクト関連のハッシュタグで検索
