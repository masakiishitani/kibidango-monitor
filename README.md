# kibidango-monitor

Kibidangoクラウドファンディングページの自動監視システム

## 概要

このリポジトリは、Kibidangoのクラウドファンディングプロジェクトを自動的に監視し、変更があった場合にGitHub Issueで通知するシステムです。

**監視対象**: [Noise Master Buds｜サウンドバイBOSE。高音質×高遮音イヤホン](https://kibidango.com/2879)

## 機能

- 🔍 **定期的な自動チェック**: 毎日午前10時（JST）に自動実行
- 📊 **変更検知**: 支援金額、支援者数、達成率、残り日数、活動報告数の変化を検知
- 📝 **自動通知**: 変更があった場合、GitHub Issueを自動作成して通知
- 💾 **履歴管理**: チェックしたデータを`data.json`に保存して変更を追跡

## 監視項目

- 💰 支援金額
- 👥 支援者数
- 📊 達成率
- ⏰ 残り日数
- 📝 活動報告数

## セットアップ

### 必要な設定

1. **リポジトリのPermissions設定**
   - Settings → Actions → General → Workflow permissions
   - "Read and write permissions" を有効化
   - "Allow GitHub Actions to create and approve pull requests" にチェック

2. **初回実行**
   - Actions タブから "Check Kibidango Project" を選択
   - "Run workflow" ボタンで手動実行

### ローカルでの実行

```bash
# 依存関係のインストール
npm install

# チェックスクリプトの実行
npm run check
```

## 仕組み

1. **GitHub Actions**: `.github/workflows/check-kibidango.yml`
   - cron スケジュールで毎日自動実行
   - 手動実行も可能

2. **チェックスクリプト**: `check.js`
   - Kibidangoのページからデータを取得
   - 前回のデータと比較して変更を検知
   - 変更があればGitHub Issueを作成

3. **データ保存**: `data.json`
   - 最新のチェック結果を保存
   - 次回チェック時の比較基準として使用

## ファイル構成

```
kibidango-monitor/
├── .github/
│   └── workflows/
│       └── check-kibidango.yml  # GitHub Actions設定
├── check.js                      # メインスクリプト
├── package.json                  # Node.js設定
├── data.json                     # 監視データ（自動生成）
├── .gitignore
└── README.md
```

## 手動実行方法

GitHub Actions を手動で実行する場合：

1. リポジトリの「Actions」タブを開く
2. 「Check Kibidango Project」を選択
3. 「Run workflow」ボタンをクリック
4. ブランチを選択して「Run workflow」を実行

## 通知の確認

変更が検知されると、以下の場所で確認できます：

- **Issues タブ**: 新しいIssueが自動作成されます
- **ラベル**: `kibidango-update` でフィルタリング可能

## カスタマイズ

### チェック頻度の変更

`.github/workflows/check-kibidango.yml` の `cron` を編集：

```yaml
schedule:
  - cron: '0 1 * * *'  # 毎日 01:00 UTC (10:00 JST)
```

例：
- 1日2回（朝・夕）: `'0 1,13 * * *'`
- 1時間ごと: `'0 * * * *'`

### 監視対象の変更

`check.js` の `PROJECT_URL` を変更：

```javascript
const PROJECT_URL = 'https://kibidango.com/YOUR_PROJECT_ID';
```

## ライセンス

MIT