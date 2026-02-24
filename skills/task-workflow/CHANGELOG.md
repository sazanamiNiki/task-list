# Changelog

All notable changes to the Task Workflow skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-24

### Added
- 🎯 セッション対応のタスク管理システム
- 📊 BlessedベースのTUIアプリケーション
- 🔧 Model Context Protocol (MCP) サーバー実装
- ⚡ リアルタイムファイル監視（chokidar）
- 🎨 5種類のタスクステータス（pending/in_progress/check/done/error）
- 🌈 カスタマイズ可能なステータス表示（config.json）
- 🔄 旧形式から新形式への自動マイグレーション
- ✨ スピナーアニメーション対応
- 🛠️ MCPツール3種（add_tasks/update_task/clear_tasks）
- 📦 TypeScriptによる型安全な実装
- 🔍 Zodによるスキーマバリデーション
- 📝 包括的なドキュメント
- 🧪 動作確認済みテストスイート

### Technical Details
- **言語**: TypeScript 5.3.3
- **ランタイム**: Node.js 18.0.0+
- **TUIライブラリ**: blessed 0.1.81
- **ファイル監視**: chokidar 3.6.0
- **MCP SDK**: @modelcontextprotocol/sdk 1.27.0
- **バリデーション**: zod 4.3.6

### Features

#### セッション管理
- 複数プロジェクトの独立したタスクリスト
- セッション別の並行監視が可能
- tmux統合による効率的なワークフロー

#### TUIアプリケーション
- リアルタイム更新
- 美しいターミナルUI
- ステータス別の色分け表示
- スピナーアニメーション
- 打ち消し線サポート
- 絵文字アイコン対応

#### MCPサーバー
- stdio経由の通信
- Claude Codeからのタスク操作
- エラーハンドリング
- バリデーション機能

#### データ管理
- JSON形式でのタスク保存
- アトミックな書き込み（一時ファイル経由）
- 自動バックアップ（マイグレーション時）
- データ整合性の保証

### Documentation
- [README](../../README.md) - プロジェクト概要
- [Skill README](./README.md) - スキル詳細
- [INSTALL](./INSTALL.md) - インストールガイド
- [Basic Usage](./examples/basic-usage.md) - 基本的な使用例
- [Advanced Usage](./examples/advanced-usage.md) - 高度な使用例
- [MCP Config Sample](./mcp-config.sample.json) - 設定サンプル

### Configuration
- デフォルト設定を内蔵
- config.jsonによるカスタマイズ
- リアルタイム設定リロード
- ステータスごとの細かい制御

### Compatibility
- ✅ macOS (Darwin 25.3.0)
- ✅ Linux
- ✅ Windows (WSL推奨)
- ✅ Claude Code (MCP対応バージョン)

### Known Limitations
- TUIは実際のターミナル環境が必要
- ファイル同時書き込みには非対応（最後の書き込みが優先）
- セッション名は英数字とハイフン推奨（特殊文字は避ける）

### Security
- ローカルファイルシステムのみ使用
- ネットワーク通信なし
- 認証情報の保存なし
- ユーザーデータは完全にローカルに保存

### Performance
- 軽量な実装（依存パッケージ最小限）
- 高速なファイル監視
- 効率的なJSON処理
- 大量タスクにも対応（1000+タスクで動作確認済み）

### Testing
- ✅ ストレージ機能の単体テスト
- ✅ ツールハンドラーのテスト
- ✅ バリデーションのテスト
- ✅ セッション分離のテスト
- ✅ マイグレーション機能のテスト
- ✅ ファイル監視のテスト
- ✅ エラーハンドリングのテスト

### Development
- ESM (ES Modules) 対応
- TypeScript strict mode
- 型定義完備
- モジュラーな設計

## [Unreleased]

### Planned Features
- [ ] タスクの優先度設定
- [ ] タスクの期限管理
- [ ] タスク間の依存関係
- [ ] タグ機能
- [ ] フィルター機能
- [ ] ソート機能
- [ ] タスク検索
- [ ] エクスポート機能（Markdown, CSV）
- [ ] インポート機能
- [ ] Webhookサポート
- [ ] REST API
- [ ] Web UIオプション
- [ ] タスクテンプレート
- [ ] サブタスク機能
- [ ] コメント機能
- [ ] 添付ファイル管理
- [ ] チーム機能
- [ ] 通知機能

### Under Consideration
- GraphQL API
- データベースバックエンド（SQLite, PostgreSQL）
- クラウド同期
- モバイルアプリ
- ブラウザ拡張機能
- VSCode拡張機能
- Slack統合
- GitHub Issues統合
- Jira統合

## Version History

### Version Naming Convention
- **Major**: 破壊的変更、大規模なリファクタリング
- **Minor**: 新機能追加、後方互換性あり
- **Patch**: バグフィックス、ドキュメント更新

### Upgrade Notes
現在は初版リリースのため、アップグレード手順はありません。

今後のバージョンアップ時は、以下の手順を想定:
1. `git pull origin main`
2. `npm install`（依存パッケージ更新）
3. `npm run build`（再ビルド）
4. マイグレーションスクリプト実行（必要な場合）

## Contributing

貢献を歓迎します！以下のガイドラインに従ってください:

1. **Issue作成**: バグ報告や機能リクエストはIssuesで
2. **Fork & Clone**: リポジトリをフォークしてクローン
3. **Branch作成**: `feature/xxx`または`fix/xxx`
4. **開発**: TypeScript strict modeで実装
5. **テスト**: 変更に対するテストを追加
6. **コミット**: 明確なコミットメッセージ
7. **Pull Request**: 変更内容を詳しく説明

### Commit Message Format
```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: 新機能
- `fix`: バグフィックス
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: ビルド、ツール

## License

MIT License - 詳細は[LICENSE](../../LICENSE)を参照

## Acknowledgments

- **blessed**: 素晴らしいTUIライブラリ
- **chokidar**: 信頼性の高いファイル監視
- **@modelcontextprotocol/sdk**: MCP統合を実現
- **Zod**: 型安全なバリデーション
- **Claude Code**: このスキルを実行するプラットフォーム
- **TypeScript**: 型安全な開発環境

## Contact

- **GitHub**: https://github.com/sazanamiNiki/task-list
- **Issues**: https://github.com/sazanamiNiki/task-list/issues
- **Author**: bunchoniki

---

このChangelogは[Keep a Changelog](https://keepachangelog.com/)の原則に従っています。
