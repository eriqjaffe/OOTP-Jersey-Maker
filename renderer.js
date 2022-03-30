const { ipcRenderer } = require('electron')

ipcRenderer.on('load-jersey', (event, data) => {
    $("#loadJersey").click()
});

ipcRenderer.on('save-jersey', (event, data) => {
    $("#saveJersey").click()
});

ipcRenderer.on('about', (event, data) => {
    $("#aboutJerseymaker").click()
});