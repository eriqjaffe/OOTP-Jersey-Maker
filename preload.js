window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
        console.log('hello from preload')
      //replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })