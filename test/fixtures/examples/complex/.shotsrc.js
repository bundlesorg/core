---
metadata:
  reference: '<https://github.com/brikcss/shots>'
---

module.exports = {
  url: '',
  viewports: [
    {
      width: 1280,
      height: 768
    },
    {
      width: 320,
      height: 640
    }
  ],
  cases: [
    {
      name: 'test',
      path: 'index.html'
    }
  ],
  server: {
    rootPath: 'dist'
  }
}
