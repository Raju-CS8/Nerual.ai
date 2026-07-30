// utils/logger.js
//
// Minimal structured logger — every call prints one JSON line with a
// timestamp, level, event name, and arbitrary context. Deliberately not
// a full logging framework (winston/pino) — for a project this size,
// a real logging library is more infrastructure than the problem needs,
// and this format is already easy to grep or pipe into a log aggregator
// later if the app ever needs one, without an API change.
const write = (level, event, context = {}) => {
  const line = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  }
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(line))
}

const logger = {
  info: (event, context) => write('info', event, context),
  warn: (event, context) => write('warn', event, context),
  error: (event, context) => write('error', event, context),
}

module.exports = logger