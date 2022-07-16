const fs = require('fs')

function generateTestList () {
  fs.writeFileSync(
    'src/router/testHelper.js',
    fs
      .readdirSync('src/views/test')
      .filter(name => /\.vue$/.test(name))
      .map(name => name.replace(/\.vue$/, ''))
      .map(name =>
        "export { default as $ } from '@/views/test/$.vue'\n".replace(
          /\$/g,
          name
        )
      )
      .join('')
  )
}

;(function () {
  generateTestList()
})()
