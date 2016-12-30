const prodConfig = require('../webpack.prod.js');
const devConfig = require('../webpack.dev.js');
const adminConfig = require('../webpack.admin.js');

module.exports = {
  // Main run
  main: prodConfig,

  // Development run
  dev: devConfig,
  
  // Admin version for NYPH website
  admin: adminConfig,

  build: {
    // configuration for this build
  },
};
