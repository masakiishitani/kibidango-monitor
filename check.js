const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const PROJECT_URL = 'https://kibidango.com/2879';
const DATA_FILE = path.join(__dirname, 'data.json');

async function fetchProjectData() {
  try {
    console.log(`Fetching ${PROJECT_URL}...`);
    const response = await axios.get(PROJECT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // プロジェクトタイトル
    const title = $('h1.project-title').text().trim() ||
                  $('title').text().trim();

    // 支援金額
    const fundingAmount = $('.funding-amount, .amount, .total-amount').first().text().trim();

    // 支援者数
    const backers = $('.backers-count, .supporters-count').first().text().trim();

    // 達成率
    const percentage = $('.percentage, .achievement-rate').first().text().trim();

    // 残り日数
    const daysLeft = $('.days-left, .remaining-days').first().text().trim();

    // 活動報告数（もし取得できる場合）
    const activityCount = $('.activity-count, .report-count').length;

    const data = {
      timestamp: new Date().toISOString(),
      url: PROJECT_URL,
      title: title || 'Noise Master Buds｜サウンドバイBOSE。高音質×高遮音イヤホン',
      fundingAmount,
      backers,
      percentage,
      daysLeft,
      activityCount
    };

    console.log('Fetched data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
}

function loadPreviousData() {
  if (fs.existsSync(DATA_FILE)) {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  }
  return null;
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Data saved to', DATA_FILE);
}

function detectChanges(oldData, newData) {
  if (!oldData) {
    return {
      isChanged: true,
      changes: ['初回チェック - データを記録しました']
    };
  }

  const changes = [];

  if (oldData.fundingAmount !== newData.fundingAmount) {
    changes.push(`💰 支援金額: ${oldData.fundingAmount} → ${newData.fundingAmount}`);
  }

  if (oldData.backers !== newData.backers) {
    changes.push(`👥 支援者数: ${oldData.backers} → ${newData.backers}`);
  }

  if (oldData.percentage !== newData.percentage) {
    changes.push(`📊 達成率: ${oldData.percentage} → ${newData.percentage}`);
  }

  if (oldData.daysLeft !== newData.daysLeft) {
    changes.push(`⏰ 残り日数: ${oldData.daysLeft} → ${newData.daysLeft}`);
  }

  if (oldData.activityCount !== newData.activityCount) {
    changes.push(`📝 活動報告: ${oldData.activityCount}件 → ${newData.activityCount}件`);
  }

  return {
    isChanged: changes.length > 0,
    changes
  };
}

async function createGitHubIssue(changes, newData) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('GITHUB_TOKEN not found. Skipping issue creation.');
    return;
  }

  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');
  if (!owner || !repo) {
    console.log('GITHUB_REPOSITORY not found. Skipping issue creation.');
    return;
  }

  const body = `
## クラウドファンディングページに変更がありました

**プロジェクト**: [${newData.title}](${PROJECT_URL})

### 変更内容
${changes.map(c => `- ${c}`).join('\n')}

### 現在の状態
- **支援金額**: ${newData.fundingAmount}
- **支援者数**: ${newData.backers}
- **達成率**: ${newData.percentage}
- **残り日数**: ${newData.daysLeft}
- **活動報告数**: ${newData.activityCount}件

---
最終チェック: ${newData.timestamp}
`;

  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        title: `📊 Kibidango更新通知 - ${new Date().toLocaleDateString('ja-JP')}`,
        body: body.trim(),
        labels: ['kibidango-update']
      },
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    console.log(`Issue created: ${response.data.html_url}`);
  } catch (error) {
    console.error('Error creating issue:', error.response?.data || error.message);
  }
}

async function main() {
  try {
    // 新しいデータを取得
    const newData = await fetchProjectData();

    // 以前のデータを読み込み
    const oldData = loadPreviousData();

    // 変更を検出
    const { isChanged, changes } = detectChanges(oldData, newData);

    if (isChanged) {
      console.log('Changes detected:');
      changes.forEach(c => console.log(`  - ${c}`));

      // GitHub Issueを作成
      await createGitHubIssue(changes, newData);

      // 新しいデータを保存
      saveData(newData);
    } else {
      console.log('No changes detected.');
    }

  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main();
