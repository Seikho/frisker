process.argv.push('dist/**/*.spec.js', '--exit', '-t', '30000')
require('../node_modules/mocha/bin/mocha')
