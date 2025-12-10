# 🔍 Kibidango Monitor

きびだんごクラウドファンディングプロジェクトの自動監視システム

## 📋 概要

このシステムは、[Noise Master Buds](https://kibidango.com/2879) のクラウドファンディングプロジェクトを自動的に監視し、変更があった場合にGitHub Issueで通知します。

## 🎯 監視項目

- 💰 **支援金額** - プロジェクトの総支援金額
- 👥 **支援者数** - 支援者の人数
- 📈 **達成率** - 目標金額に対する達成率
- ⏰ **残り日数** - プロジェクト終了までの残り日数
- 📝 **活動報告数** - 新しい活動報告の投稿数

## ⚙️ セットアップ

### 1. GitHub Actionsの権限設定

リポジトリの設定で、GitHub Actionsに必要な権限を付与してください：

1. [Settings → Actions → General](https://github.com/masakiishitani/kibidango-monitor/settings/actions) にアクセス
2. **Workflow permissions** セクションで以下を設定：
   - ✅ 「**Read and write permissions**」を選択
   - ✅ 「**Allow GitHub Actions to create and approve pull requests**」にチェック
3. 「**Save**」ボタンをクリック

### 2. 初回実行

1. [Actions タブ](https://github.com/masakiishitani/kibidango-monitor/actions) にアクセス
2. 左側のワークフロー一覧から「**Check Kibidango Project**」を選択
3. 右上の「**Run workflow**」ボタンをクリック
4. ブランチを選択して「**Run workflow**」を実行

## 🚀 使い方

### 自動実行

毎日午前10時（JST）に自動的にチェックが実行されます。

### 手動実行

いつでもGitHub Actionsから手動で実行できます：

1. [Actions タブ](https://github.com/masakiishitani/kibidango-monitor/actions)
2. 「Check Kibidango Project」を選択
3. 「Run workflow」をクリック

### ローカルで実行

```bash
# 依存関係をインストール
npm install

# 監視スクリプトを実行
npm run check
```

## 📬 通知の仕組み

- プロジェクトに**変更があった場合**のみ、GitHub Issueが自動作成されます
- Issueには変更前後の値が記録されます
- 変更がない場合は、Issueは作成されません

## 📁 ファイル構成

```
kibidango-monitor/
├── .github/
│   └── workflows/
│       └── check-kibidango.yml  # GitHub Actions設定
├── check.js                      # メイン監視スクリプト
├── package.json                  # Node.js設定
├── data.json                     # 前回チェック時のデータ（自動生成）
├── .gitignore
└── README.md
```

## 🔧 カスタマイズ

### 監視頻度の変更

`.github/workflows/check-kibidango.yml` の `cron` 設定を変更：

```yaml
schedule:
  - cron: '0 1 * * *'  # 毎日 JST 10:00
  # 例: '0 */6 * * *'  # 6時間ごと
```

### 監視URLの変更

`check.js` の `TARGET_URL` を変更：

```javascript
const TARGET_URL = 'https://kibidango.com/YOUR_PROJECT_ID';
```

## 📊 データ履歴

前回チェック時のデータは `data.json` に保存され、次回チェック時の比較に使用されます。

## 🤝 サポート

問題が発生した場合は、[Issues](https://github.com/masakiishitani/kibidango-monitor/issues) で報告してください。

## 📝 ライセンス

MIT License

---

🤖 自動監視システム by GitHub Actions
