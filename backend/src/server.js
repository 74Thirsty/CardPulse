const http = require('http');
const { router } = require('./router');

function createApp() {
  return http.createServer((req, res) => router.handle(req, res));
}

if (require.main === module) {
  const port = process.env.PORT || 4000;
  const server = createApp();
  server.listen(port, () => {
    console.log(`CardPulse backend listening on port ${port}`);
  });
}

module.exports = {
  createApp,
};
