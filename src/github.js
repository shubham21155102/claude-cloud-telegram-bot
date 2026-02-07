const GITHUB_TOKEN = process.env.GH_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g. "shubham21155102/claude-cloud"
const EVENT_TYPE = process.env.EVENT_TYPE || 'slack-trigger';

if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('❌ GH_TOKEN and GITHUB_REPO are required');
  process.exit(1);
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
};

/**
 * Trigger the contribution workflow via repository_dispatch
 */
async function triggerWorkflow({ org, repo, issue, show_logs = false }) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: EVENT_TYPE,
      client_payload: { org, repo, issue, show_logs },
    }),
  });

  if (res.status === 204) {
    return { success: true };
  }

  const text = await res.text();
  return { success: false, status: res.status, message: text };
}

/**
 * Get recent workflow runs
 */
async function getWorkflowRuns(count = 5) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=${count}`,
    { headers }
  );
  const data = await res.json();
  return data.workflow_runs || [];
}

/**
 * Get logs download URL for a specific run
 */
async function getRunLogs(runId) {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${runId}/logs`,
    { headers, redirect: 'manual' }
  );
  // GitHub returns a 302 redirect to the actual logs URL
  return res.headers.get('location') || `https://github.com/${GITHUB_REPO}/actions/runs/${runId}`;
}

module.exports = { triggerWorkflow, getWorkflowRuns, getRunLogs };
