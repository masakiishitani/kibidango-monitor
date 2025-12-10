const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const core = require('@actions/core');
const github = require('@actions/github');

const PROJECT_URL = 'https://kibidango.com/2879';
const DATA_FILE = 'data.json';

async function fetchProjectData() {
  try {
    const response = await axios.get(PROJECT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // ページから情報を抽出（セレクタは実際のページ構造に合わせて調整が必要）
    const data = {
      amount: extractNumber($('.project-amount').text()) || extractNumber($('[class*="amount"]').first().text()),
      supporters: extractNumber($('.project-supporters').text()) || extractNumber($('[class*="supporter"]').first().text()),
      achievementRate: extractNumber($('.project-achievement').text()) || extractNumber($('[class*="achievement"]').first().text()),
      remainingDays: extractNumber($('.project-remaining').text()) || extractNumber($('[class*="remaining"]').first().text()),
      activityCount: extractNumber($('.activity-count').text()) || extractActivitiesCount($),
      timestamp: new Date().toISOString(),
      url: PROJECT_URL
    };

    console.log('Fetched data:', JSON.stringify(data, null, 2));
    return data;

  } catch (error) {
    console.error('Error fetching project data:', error.message);
    throw error;
  }
}

function extractNumber(text) {
  if (!text) return null;
  const match = text.replace(/,/g, '').match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function extractActivitiesCount($) {
  // 活動報告の数を取得（複数の方法を試す）
  const activityElements = $('.activity-item, .report-item, [class*="activity"], [class*="report"]');
  if (activityElements.length > 0) return activityElements.length;

  const activityText = $('body').text();
  const match = activityText.match(/活動報告[：:]\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

async function loadPreviousData() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.log('No previous data found');
    return null;
  }
}

async function saveData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  console.log('Data saved to', DATA_FILE);
}

function compareData(oldData, newData) {
  if (!oldData) {
    return {
      hasChanges: true,
      changes: ['初回チェック - ベースラインデータを記録しました']
    };
  }

  const changes = [];

  if (oldData.amount !== newData.amount) {
    const diff = newData.amount - oldData.amount;
    changes.push(`💰 支援金額: ${oldData.amount?.toLocaleString()}円 → ${newData.amount?.toLocaleString()}円 (${diff > 0 ? '+' : ''}${diff.toLocaleString()}円)`);
  }

  if (oldData.supporters !== newData.supporters) {
    const diff = newData.supporters - oldData.supporters;
    changes.push(`👥 支援者数: ${oldData.supporters}人 → ${newData.supporters}人 (${diff > 0 ? '+' : ''}${diff}人)`);
  }

  if (oldData.achievementRate !== newData.achievementRate) {
    changes.push(`📈 達成率: ${oldData.achievementRate}% → ${newData.achievementRate}%`);
  }

  if (oldData.remainingDays !== newData.remainingDays) {
    changes.push(`⏰ 残り日数: ${oldData.remainingDays}日 → ${newData.remainingDays}日`);
  }

  if (oldData.activityCount !== newData.activityCount) {
    const diff = newData.activityCount - oldData.activityCount;
    changes.push(`📝 活動報告: ${oldData.activityCount}件 → ${newData.activityCount}件 (${diff > 0 ? '+' : ''}${diff}件)`);
  }

  return {
    hasChanges: changes.length > 0,
    changes
  };
}

async function createGitHubIssue(changes, newData) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('GITHUB_TOKEN not found, skipping issue creation');
    return;
  }

  const octokit = github.getOctokit(token);
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');

  const title = `[更新検知] ${new Date().toLocaleDateString('ja-JP')} - Kibidango プロジェクト`;
  const body = `
## プロジェクト更新情報

**URL:** ${PROJECT_URL}
**チェック日時:** ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}

### 変更内容

${changes.map(change => `- ${change}`).join('\n')}

### 現在の状態

- 💰 支援金額: ${newData.amount?.toLocaleString() || 'N/A'}円
- 👥 支援者数: ${newData.supporters || 'N/A'}人
- 📈 達成率: ${newData.achievementRate || 'N/A'}%
- ⏰ 残り日数: ${newData.remainingDays || 'N/A'}日
- 📝 活動報告: ${newData.activityCount || 'N/A'}件

---
*このIssueは自動生成されました*
`;

  try {
    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
      labels: ['auto-generated', 'kibidango-update']
    });
    console.log('GitHub Issue created:', issue.data.html_url);
  } catch (error) {
    console.error('Error creating GitHub Issue:', error.message);
  }
}

async function main() {
  try {
    console.log('🔍 Checking Kibidango project...');
    console.log('URL:', PROJECT_URL);

    const newData = await fetchProjectData();
    const oldData = await loadPreviousData();

    const { hasChanges, changes } = compareData(oldData, newData);

    if (hasChanges) {
      console.log('✅ Changes detected!');
      console.log('Changes:', changes);

      await createGitHubIssue(changes, newData);
    } else {
      console.log('ℹ️  No changes detected');
    }

    await saveData(newData);
    console.log('✅ Check completed successfully');

  } catch (error) {
    console.error('❌ Error:', error.message);
    core.setFailed(error.message);
    process.exit(1);
  }
}

main();
