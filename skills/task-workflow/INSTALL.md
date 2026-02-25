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
- `proper-lockfile`: ファイルロック機構（複数セッション対応）

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
      "args": ["/absolute/path/to/task-list/dist/mcp/index.js"]
    }
  }
}
```

**重要**:
- `args`は**絶対パス**で指定してください（Claude Codeの実行ディレクトリに依存しません）
- `tasks.json`はtask-listリポジトリのルートディレクトリに自動的に作成されます
- Claude Codeをどのディレクトリで実行しても、常に同じ場所（task-listのルート）にタスクデータが保存されます

### スキルのインストール

Claude Codeでスキルを使用したい**各プロジェクト**に、スキルファイルをコピーします。

#### macOS / Linux

```bash
# スキルを使用したいプロジェクトに移動
cd ~/my-project

# .claudeディレクトリを作成
mkdir -p .claude/skills

# task-workflowスキルをコピー
cp -r /path/to/task-list/skills/task-workflow .claude/skills/

# 確認
ls .claude/skills/task-workflow/skill.md
```

#### Windows

PowerShellで実行:

```powershell
# スキルを使用したいプロジェクトに移動
cd C:\Users\YourName\my-project

# .claudeディレクトリを作成
New-Item -ItemType Directory -Force -Path .claude\skills

# task-workflowスキルをコピー
Copy-Item -Recurse C:\path\to\task-list\skills\task-workflow .claude\skills\

# 確認
Get-Item .claude\skills\task-workflow\skill.md
```

以下のファイルが存在すればOK:
- `.claude/skills/task-workflow/skill.md` (Claude Code用の指示書)
- `.claude/skills/task-workflow/skill.json` (スキル定義)
- `.claude/skills/task-workflow/README.md`

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
      "args": ["C:\\path\\to\\task-list\\dist\\mcp\\index.js"]
    }
  }
}
```

### 設定の確認

Claude Codeを再起動後、以下を確認:

#### MCPサーバーの確認

```
MCPサーバーのリストを表示してください
```

`task-workflow`が表示されればOK。

利用可能なツール:
- `add_tasks`: タスクの一括追加
- `update_task`: タスクステータスの更新
- `clear_tasks`: タスクのクリア

#### スキルの確認

Claude Codeでプロジェクトを開き、以下を確認:

1. **スキルファイルの確認**:
   ```bash
   # プロジェクトルートで実行
   ls -la .claude/skills/task-workflow/skill.md
   ```
   ファイルが存在すればOK。

2. **スキルの動作確認**:
   スキルをインストールしたプロジェクトでClaude Codeを起動し、以下のようなリクエストを実行:
   ```
   簡単な機能を3ステップで実装してください
   ```

   実行計画作成時に、自動的にタスクが`tasks.json`に追加されればスキルが正常に動作しています。

3. **TUIでの確認**:
   task-listリポジトリで別ターミナルを開き、TUIアプリを起動:
   ```bash
   # task-listリポジトリに移動
   cd /path/to/task-list

   # プロジェクト名を指定してTUI起動
   SESSION=my-project npm start
   ```

   （`my-project`は手順2で作業していたプロジェクト名に置き換えてください）

   追加されたタスクがリアルタイムで表示されればOK。

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

### tasks.jsonの保存場所

**仕様**: `tasks.json`は常にtask-listリポジトリのルートディレクトリに保存されます

**確認方法**:

MCPサーバーのデバッグログ（stderrに出力）で以下を確認:
```
[DEBUG] PROJECT_ROOT: /absolute/path/to/task-list
[DEBUG] TASKS_FILE: /absolute/path/to/task-list/tasks.json
```

Claude Codeを再起動後、タスクを追加して`/path/to/task-list/tasks.json`が作成されることを確認してください。

**注意**: 以前の環境変数`TASKS_DIR`による設定方法は廃止されました。Claude CodeのMCP設定の`env`フィールドが正しく読み込まれない問題があったため、固定パス方式に変更しています。

### 複数のClaude Codeセッションでの使用

**仕様**: 複数のClaude Codeセッションを同時に実行しても、ファイルロック機構により安全にタスク操作が可能です

**動作**:
- 各MCPサーバープロセスはtasks.jsonへのアクセス時にファイルロックを取得
- 他のプロセスがロック中の場合は自動的に待機（最大10回リトライ）
- すべてのプロセスの変更が保持され、データ損失が防止されます

**例**:
```bash
# 複数のプロジェクトで同時にClaude Codeを実行
cd ~/project-a && claude
cd ~/project-b && claude

# 両方のセッションでタスクを追加しても、安全にtasks.jsonに反映されます
```

**注意**: ロック取得の待機時間は通常数ミリ秒〜数百ミリ秒程度ですが、極端に多数のプロセスが同時アクセスする場合は、一時的な遅延が発生する可能性があります。

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
