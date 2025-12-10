# kibidango-monitor

Kibidangoクラウドファンディングプロジェクトの自動監視システム

## 概要

このリポジトリは、Kibidangoのクラウドファンディングプロジェクト（Noise Master Buds）を自動的に監視し、変更があった場合にGitHub Issueで通知するシステムです。

**監視対象:** https://kibidango.com/2879

## 機能

### 自動監視
- 毎日午前10時（JST）に自動チェック
- 手動実行も可能

### 監視項目
- 💰 支援金額
- 👥 支援者数
- 📈 達成率
- ⏰ 残り日数
- 📝 活動報告数

### 通知機能
- 変更があればGitHub Issueを自動作成
- 変更内容を詳細に記録
- 自動生成されたIssueには `auto-generated` と `kibidango-update` ラベルが付与されます

### 履歴管理
- `data.json` に最新データを保存
- 次回チェック時に比較して変更を検知

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/masakiishitani/kibidango-monitor.git
cd kibidango-monitor
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. GitHub Actionsの権限設定

リポジトリの設定で、GitHub Actionsに必要な権限を付与します：

1. リポジトリの **Settings** → **Actions** → **General**
2. **Workflow permissions** で「**Read and write permissions**」を選択
3. 「**Allow GitHub Actions to create and approve pull requests**」にチェック
4. 変更を保存

## 使い方

### 手動実行

GitHubのリポジトリページで：

1. **Actions** タブを開く
2. 「**Check Kibidango Project**」ワークフローを選択
3. 「**Run workflow**」ボタンをクリック
4. ブランチを選択して実行

### ローカルでの実行

```bash
npm run check
```

※ローカル実行時はGitHub Issueの作成はスキップされます（GITHUB_TOKENが必要）

## ファイル構成

```
kibidango-monitor/
├── .github/
│   └── workflows/
│       └── check-kibidango.yml  # GitHub Actions設定
├── check.js                     # メイン監視スクリプト
├── package.json                 # Node.js設定
├── data.json                    # 最新データ（自動生成）
├── .gitignore
└── README.md
```

## 動作の仕組み

1. **データ取得**: axiosでプロジェクトページにアクセス
2. **解析**: cheerioでHTMLを解析し、必要な情報を抽出
3. **比較**: 前回保存したdata.jsonと比較
4. **通知**: 変更があればGitHub Issueを作成
5. **保存**: 最新データをdata.jsonに保存してコミット

## 監視スケジュール

- **自動実行**: 毎日午前10時（日本時間）
- **cron設定**: `0 1 * * *` (UTC 1:00 = JST 10:00)

スケジュールを変更したい場合は、`.github/workflows/check-kibidango.yml` の `cron` 設定を編集してください。

## トラブルシューティング

### Issueが作成されない

- GitHub Actionsの権限設定を確認してください
- ワークフローが正常に実行されているか **Actions** タブで確認してください

### データが更新されない

- ワークフローログを確認してスクリプトエラーがないかチェックしてください
- Kibidangoのページ構造が変更された可能性があります（その場合はセレクタの調整が必要）

### 手動実行ができない

- ワークフローファイルに `workflow_dispatch:` が含まれているか確認してください

## 今後の拡張予定

- 複数プロジェクトの監視対応
- Slack通知機能の追加
- グラフ化・可視化機能

## ライセンス

MIT

## 作成者

masakiishitani
