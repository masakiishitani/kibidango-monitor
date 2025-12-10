const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 監視対象のURL
const TARGET_URL = 'https://kibidango.com/2879';
const DATA_FILE = path.join(__dirname, 'data.json');

/**
 * クラウドファンディングページから情報を取得
 */
async function fetchProjectData() {
  let browser;
  try {
    console.log(`📡 データ取得中: ${TARGET_URL}`);

    // Puppeteerでブラウザを起動
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // ビューポートを設定
    await page.setViewport({ width: 1920, height: 1080 });

    // User-Agentを設定
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');

    // ページにアクセス
    await page.goto(TARGET_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // ページの内容を取得して解析
    const data = await page.evaluate(() => {
      // 支援金額を取得
      const amountElement = document.querySelector('.project-amount, .amount, [class*="amount"], [class*="金額"]');
      const amount = amountElement ? amountElement.textContent.trim() : '不明';

      // 支援者数を取得
      const supportersElement = document.querySelector('.project-supporters, .supporters, [class*="supporter"], [class*="支援者"]');
      const supporters = supportersElement ? supportersElement.textContent.trim() : '不明';

      // 達成率を取得
      const rateElement = document.querySelector('.achievement-rate, .rate, [class*="achievement"], [class*="達成"]');
      const achievementRate = rateElement ? rateElement.textContent.trim() : '不明';

      // 残り日数を取得
      const daysElement = document.querySelector('.days-left, .remaining, [class*="days"], [class*="残り"]');
      const daysLeft = daysElement ? daysElement.textContent.trim() : '不明';

      // 活動報告数を取得（より柔軟に）
      const activityElement = document.querySelector('.activity-count, [class*="activity"], [class*="報告"], a[href*="action"]');
      const activityCount = activityElement ? activityElement.textContent.trim() : '不明';

      return {
        amount,
        supporters,
        achievementRate,
        daysLeft,
        activityCount,
        checkedAt: new Date().toISOString()
      };
    });

    console.log('✅ データ取得成功:', data);
    return data;
  } catch (error) {
    console.error('❌ データ取得エラー:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 前回のデータを読み込み
 */
function loadPreviousData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('⚠️  前回データの読み込みエラー:', error.message);
  }
  return null;
}

/**
 * データを保存
 */
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 データを保存しました');
  } catch (error) {
    console.error('❌ データ保存エラー:', error.message);
  }
}

/**
 * 変更を検出して報告
 */
function detectChanges(previous, current) {
  if (!previous) {
    console.log('🆕 初回チェックです');
    return { isFirstCheck: true, changes: [] };
  }

  const changes = [];

  if (previous.amount !== current.amount) {
    changes.push(`💰 支援金額: ${previous.amount} → ${current.amount}`);
  }

  if (previous.supporters !== current.supporters) {
    changes.push(`👥 支援者数: ${previous.supporters} → ${current.supporters}`);
  }

  if (previous.achievementRate !== current.achievementRate) {
    changes.push(`📈 達成率: ${previous.achievementRate} → ${current.achievementRate}`);
  }

  if (previous.daysLeft !== current.daysLeft) {
    changes.push(`⏰ 残り日数: ${previous.daysLeft} → ${current.daysLeft}`);
  }

  if (previous.activityCount !== current.activityCount) {
    changes.push(`📝 活動報告数: ${previous.activityCount} → ${current.activityCount}`);
  }

  return { isFirstCheck: false, changes };
}

/**
 * GitHub Issueの本文を生成
 */
function generateIssueBody(current, changes) {
  let body = `## 📊 プロジェクト状況\n\n`;
  body += `- 💰 **支援金額**: ${current.amount}\n`;
  body += `- 👥 **支援者数**: ${current.supporters}\n`;
  body += `- 📈 **達成率**: ${current.achievementRate}\n`;
  body += `- ⏰ **残り日数**: ${current.daysLeft}\n`;
  body += `- 📝 **活動報告数**: ${current.activityCount}\n\n`;

  if (changes.length > 0) {
    body += `## 🔔 変更内容\n\n`;
    changes.forEach(change => {
      body += `- ${change}\n`;
    });
  } else {
    body += `## ℹ️ 変更なし\n\n前回チェックから変更はありませんでした。\n`;
  }

  body += `\n---\n`;
  body += `📅 チェック日時: ${new Date(current.checkedAt).toLocaleString('ja-JP')}\n`;
  body += `🔗 プロジェクトURL: ${TARGET_URL}\n`;

  return body;
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log('🚀 クラウドファンディング監視開始');

    // データ取得
    const currentData = await fetchProjectData();

    // 前回データと比較
    const previousData = loadPreviousData();
    const { isFirstCheck, changes } = detectChanges(previousData, currentData);

    // データ保存
    saveData(currentData);

    // 結果出力
    if (isFirstCheck) {
      console.log('🆕 初回チェック完了。次回から変更を検出します。');
    } else if (changes.length > 0) {
      console.log('🔔 変更を検出しました:');
      changes.forEach(change => console.log(`  ${change}`));

      // GitHub Actionsで実行されている場合、Issueを作成するための出力
      if (process.env.GITHUB_ACTIONS) {
        const issueBody = generateIssueBody(currentData, changes);
        console.log('\n--- ISSUE_BODY ---');
        console.log(issueBody);
        console.log('--- END_ISSUE_BODY ---');
      }
    } else {
      console.log('✅ 変更なし。プロジェクトは安定しています。');
    }

    console.log('✅ 監視完了');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main();
