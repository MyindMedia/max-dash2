module.exports = {
  apps: [
    {
      name: 'max-dash',
      script: 'server.js',
      cwd: '/Users/myindsound/Documents/discord/max-dash2',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'ngrok',
      script: 'ngrok',
      args: 'http 3000',
      cwd: '/Users/myindsound/Documents/discord/max-dash2',
      autorestart: false
    }
  ]
};
