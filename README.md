# 🤖 Claude Cloud Telegram Bot

Trigger [Claude Cloud](https://github.com/shubham21155102/claude-cloud) GitHub Actions workflows directly from Telegram.

## Architecture

```
Telegram → Bot (polling) → GitHub API (repository_dispatch) → GitHub Actions Workflow
```

## Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token

### 2. Get Your Chat ID

Send any message to your bot, then visit:
```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```
Look for `"chat":{"id":123456789}` — that's your chat ID.

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Run

```bash
# Local
npm install
npm start

# Docker
docker compose up -d

# Docker (manual)
docker build -t claude-cloud-bot .
docker run -d --env-file .env --name claude-bot claude-cloud-bot
```

## Commands

| Command | Description |
|---------|-------------|
| `/contribute <org> <repo> <issue>` | Trigger a contribution workflow |
| `/contribute_logs <org> <repo> <issue>` | Same with Claude Code logs enabled |
| `/status` | Show last 5 workflow runs with links |
| `/logs [run_id]` | Get logs download link |
| `/help` | Show help message |

### Examples

```
/contribute facebook react Fix the useEffect cleanup bug in concurrent mode
/contribute_logs myorg myrepo Add dark mode support to the dashboard
/status
/logs 12345678
```

## Deployment Options

- **EC2**: Run on a `t3.nano` — cheapest, uses long-polling (no inbound ports needed)
- **ECS Fargate**: Small task definition, auto-restart
- **Docker on any VPS**: `docker compose up -d`

## Security

- Set `ALLOWED_CHAT_IDS` to restrict who can trigger workflows
- The bot uses long-polling (outbound only) — no webhook/ports to expose
- Never commit `.env` — it's in `.gitignore`
