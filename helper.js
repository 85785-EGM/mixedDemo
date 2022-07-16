const fs = require('fs')

function generateTestList () {
  const files = fs
    .readdirSync('src/views/test')
    .filter(name => /\.vue$/.test(name))
    .map(name => name.replace(/\.vue$/, ''))
  const template = "export { default as $ } from '@/views/test/$.vue'\n"
  const fileStr = files.map(name => template.replace(/\$/g, name)).join('')

  fs.writeFileSync('src/router/testHelper.js', fileStr)
}

;(function () {
  generateTestList()
})()
