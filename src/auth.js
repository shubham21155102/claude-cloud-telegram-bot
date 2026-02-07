const ALLOWED_CHAT_IDS = (process.env.ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(Number)
  .filter(Boolean);

/**
 * Check if a chat ID is authorized.
 * If ALLOWED_CHAT_IDS is empty, all users are allowed.
 */
function isAuthorized(chatId) {
  if (!ALLOWED_CHAT_IDS.length) return true;
  return ALLOWED_CHAT_IDS.includes(chatId);
}

module.exports = { isAuthorized };
