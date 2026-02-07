const TelegramBot = require('node-telegram-bot-api');
const { triggerWorkflow, getWorkflowRuns, getRunLogs } = require('./github');
const { enhancePrompt, askQuestion } = require('./zai');
const { isAuthorized } = require('./auth');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Telegram has a 4096 char limit per message
const MAX_MSG_LEN = 4000;

/**
 * Send a long message, splitting into chunks if needed
 */
async function sendLong(chatId, text, opts = {}) {
  if (text.length <= MAX_MSG_LEN) {
    return bot.sendMessage(chatId, text, opts);
  }
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_MSG_LEN));
    remaining = remaining.slice(MAX_MSG_LEN);
  }
  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk, opts);
  }
}

// ─── /contribute <org> <repo> <issue> ─────────────────────────────────
bot.onText(/\/contribute\s+(\S+)\s+(\S+)\s+(.+)/s, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return bot.sendMessage(chatId, '⛔ Unauthorized.');

  const [, org, repo, issue] = match;

  await bot.sendMessage(
    chatId,
    `🚀 Triggering contribution to *${org}/${repo}*...\n📋 Issue: ${issue}`,
    { parse_mode: 'Markdown' }
  );

  try {
    const result = await triggerWorkflow({ org, repo, issue: issue.trim(), show_logs: false });
    if (result.success) {
      await bot.sendMessage(chatId, '✅ Workflow triggered successfully!');
    } else {
      await bot.sendMessage(chatId, `❌ GitHub API error (${result.status}): ${result.message}`);
    }
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ─── /contribute_logs <org> <repo> <issue> ─────────────────────────────
bot.onText(/\/contribute_logs\s+(\S+)\s+(\S+)\s+(.+)/s, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return bot.sendMessage(chatId, '⛔ Unauthorized.');

  const [, org, repo, issue] = match;

  await bot.sendMessage(
    chatId,
    `🚀 Triggering contribution (with logs) to *${org}/${repo}*...`,
    { parse_mode: 'Markdown' }
  );

  try {
    const result = await triggerWorkflow({ org, repo, issue: issue.trim(), show_logs: true });
    if (result.success) {
      await bot.sendMessage(chatId, '✅ Workflow triggered with logs enabled!');
    } else {
      await bot.sendMessage(chatId, `❌ GitHub API error (${result.status}): ${result.message}`);
    }
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ─── /enhance <short prompt> ──────────────────────────────────────────
bot.onText(/\/enhance\s+(.+)/s, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return bot.sendMessage(chatId, '⛔ Unauthorized.');

  const shortPrompt = match[1].trim();

  await bot.sendMessage(chatId, '🔄 Enhancing your prompt...');

  try {
    const enhanced = await enhancePrompt(shortPrompt);
    await sendLong(chatId, `✨ *Enhanced Prompt:*\n\n${enhanced}`, { parse_mode: 'Markdown' });
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ─── /ask <question> ──────────────────────────────────────────────────
bot.onText(/\/ask\s+(.+)/s, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return bot.sendMessage(chatId, '⛔ Unauthorized.');

  const question = match[1].trim();

  await bot.sendMessage(chatId, '🤔 Thinking...');

  try {
    const answer = await askQuestion(question);
    await sendLong(chatId, answer);
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ─── /status ───────────────────────────────────────────────────────────
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return bot.sendMessage(chatId, '⛔ Unauthorized.');

  try {
    const runs = await getWorkflowRuns(5);

    if (!runs.length) {
      return bot.sendMessage(chatId, 'No recent workflow runs found.');
    }

    const statusEmoji = {
      success: '✅',
      completed: '✅',
      in_progress: '🔄',
      queued: '⏳',
      failure: '❌',
      cancelled: '🚫',
    };

    const lines = runs.map((r) => {
      const emoji = statusEmoji[r.conclusion] || statusEmoji[r.status] || '❓';
      const date = new Date(r.created_at).toLocaleString();
      return `${emoji} *${r.name}* — ${r.conclusion || r.status}\n   📅 ${date}\n   🔗 [View Run](${r.html_url})`;
    });

    await bot.sendMessage(
      chatId,
      `📊 *Recent Workflow Runs:*\n\n${lines.join('\n\n')}`,
      { parse_mode: 'Markdown', disable_web_page_preview: true }
    );
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ─── /logs [run_id] ───────────────────────────────────────────────────
bot.onText(/\/logs(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAuthorized(chatId)) return bot.sendMessage(chatId, '⛔ Unauthorized.');

  try {
    let runId = match[1];

    if (!runId) {
      const runs = await getWorkflowRuns(1);
      if (!runs.length) return bot.sendMessage(chatId, 'No workflow runs found.');
      runId = runs[0].id;
    }

    await bot.sendMessage(chatId, `📥 Fetching logs for run #${runId}...`);
    const logsUrl = await getRunLogs(runId);
    await bot.sendMessage(chatId, `📄 [Download Logs](${logsUrl})`, {
      parse_mode: 'Markdown',
    });
  } catch (err) {
    await bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

// ─── /help ─────────────────────────────────────────────────────────────
bot.onText(/\/help|\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🤖 *Claude Cloud Trigger Bot*

*Workflow Commands:*
\`/contribute <org> <repo> <issue>\`
Trigger a contribution workflow

\`/contribute_logs <org> <repo> <issue>\`
Same but with Claude Code logs enabled

\`/status\`
Show last 5 workflow runs

\`/logs [run_id]\`
Get logs download link

*AI Commands:*
\`/enhance <short prompt>\`
Turn a short prompt into a detailed, descriptive one

\`/ask <question>\`
Ask any question, powered by Claude

*Examples:*
\`/contribute facebook react Fix useEffect cleanup bug\`
\`/enhance add dark mode\`
\`/ask How do I set up a Kubernetes ingress controller?\``,
    { parse_mode: 'Markdown' }
  );
});

console.log('🤖 Telegram bot is running...');