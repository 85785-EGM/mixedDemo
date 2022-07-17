const { app, BrowserWindow, Menu, Tray } = require('electron')

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('dist/index.html')
  win.hide()
  const iconTray = new Tray('dist/favicon.jfif')
  iconTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: '设置',
        click: function () {
          console.log('setting')
        }
      }
    ])
  )

  iconTray.on('double-click', function () {
    win.show()
  })
}

app.whenReady().then(() => {
  createWindow()
})
