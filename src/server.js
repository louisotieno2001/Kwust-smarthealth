const app = require('./app');
const { env } = require('./config/env');

const server = app.listen(env.port, () => {
  console.log(`KWUST SmartHealth running at ${env.appUrl} (port ${env.port})`);
});

function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
