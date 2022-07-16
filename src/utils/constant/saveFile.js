export async function saveFile (blob, filename, opt = {}) {
  const link = document.createElement('a')
  link.style.display = 'none'
  document.body.appendChild(link)
  const url = opt.url ?? URL.createObjectURL(blob)
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  document.body.removeChild(link)
  link.remove()
}
