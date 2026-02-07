# 🤖 Claude Cloud Telegram Bot

Trigger [Claude Cloud](https://github.com/shubham21155102/claude-cloud) GitHub Actions workflows and interact with AI — all from Telegram.

## Architecture

```
Telegram → Bot (polling) → GitHub API (repository_dispatch) → GitHub Actions Workflow
                         → Z.AI API (Claude) → AI responses
```

## Features

- **Trigger GitHub Actions** — Run Claude Cloud contribution workflows from Telegram
- **Prompt Enhancement** — Turn short, vague prompts into detailed, well-structured ones using AI
- **AI Q&A** — Ask any question, powered by Claude via Z.AI
- **Workflow Monitoring** — Check run status and download logs

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
```

## Commands

### Workflow Commands

| Command | Description |
|---------|-------------|
| `/contribute <org> <repo> <issue>` | Trigger a contribution workflow |
| `/contribute_logs <org> <repo> <issue>` | Same with Claude Code logs enabled |
| `/status` | Show last 5 workflow runs with links |
| `/logs [run_id]` | Get logs download link (latest if no ID) |

### AI Commands

| Command | Description |
|---------|-------------|
| `/enhance <short prompt>` | Turn a short prompt into a detailed, descriptive one |
| `/ask <question>` | Ask any question, powered by Claude |

## Examples

```
# Trigger a contribution
/contribute facebook react Fix the useEffect cleanup bug in concurrent mode

# Enhance a vague prompt before contributing
/enhance add dark mode
# Bot returns a detailed prompt → use it with /contribute

# Ask a question
/ask How do I set up a Kubernetes ingress controller with TLS?

# Check workflow status
/status

# Get logs for a specific run
/logs 12345678
```

## Deployment

### Docker (EC2 / any VPS)

```bash
# Login to GitHub Container Registry
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u shubham21155102 --password-stdin

# Create .env with your secrets
nano .env

# Pull and run
docker compose -f docker-compose.prod.yml up -d

# Update to latest
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```

### Local Development

```bash
npm install
npm run dev  # auto-restart on file changes
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ | Bot token from @BotFather |
| `GH_TOKEN` | ✅ | GitHub PAT with `repo` scope |
| `GITHUB_REPO` | ✅ | Repo with the workflow (e.g. `shubham21155102/claude-cloud`) |
| `ZAI_API_KEY` | ✅ | Z.AI API key for `/enhance` and `/ask` |
| `ALLOWED_CHAT_IDS` | ❌ | Comma-separated chat IDs (empty = allow all) |
| `EVENT_TYPE` | ❌ | Dispatch event type (default: `slack-trigger`) |
| `ZAI_MODEL` | ❌ | Model to use (default: `claude-opus-4-5-20251101`) |

## Security

- Set `ALLOWED_CHAT_IDS` to restrict who can trigger workflows
- Bot uses long-polling (outbound only) — no ports to expose
- Never commit `.env` — it's in `.gitignore`

## License

MIT