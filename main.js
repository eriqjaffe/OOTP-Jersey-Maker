const { app, BrowserWindow, dialog, Menu, shell, ipcMain, ipcRenderer } = require('electron')
const path = require('path')
const fs = require('fs');
//const express = require('express');
const Jimp = require('jimp');
const imagemagickCli = require('imagemagick-cli');
const ttfInfo = require('ttfinfo');
const isMac = process.platform === 'darwin'
const os = require('os');
const tempDir = os.tmpdir()
//const app2 = express()const url = require('url');
const archiver = require('archiver')
//const font2base64 = require("node-font2base64")
const Store = require("electron-store")

const store = new Store();

const preferredColorFormat = store.get("preferredColorFormat", "hex")
const preferredTexture = store.get("preferredTexture", "default_jersey_texture")

ipcMain.on('upload-image', (event, arg) => {
	const json = {}
	dialog.showOpenDialog(null, {
	properties: ['openFile'],
	filters: [
		{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }
	]
	}).then(result => {
		if(!result.canceled) {
		Jimp.read(result.filePaths[0], (err, image) => {
			if (err) {
				console.log(err);
			} else {
				image.getBase64(Jimp.AUTO, (err, ret) => {
					json.filename = path.basename(result.filePaths[0]),
					json.image = ret
					//console.log(json)
					event.sender.send('upload-image-response', json)
				})
			}
		});
		}
	}).catch(err => {
		console.log(err)
	})
})

ipcMain.on('save-jersey', (event, arg) => {
	console.log(arg)
	const buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	const json = Buffer.from(arg.canvas, 'utf-8')

	const output = fs.createWriteStream(tempDir + '/'+arg.name+'.zip');

	output.on('close', function() {
		//fs.writeFileSync(app.getPath('downloads') + '/' + arg.name+'.jrs', json)
		var data = fs.readFileSync(tempDir + '/'+arg.name+'.zip');
		var saveOptions = {
		  defaultPath: app.getPath('downloads') + '/' + arg.name+'.zip',
		}
		dialog.showSaveDialog(null, saveOptions).then((result) => { 
		  if (!result.canceled) {
			fs.writeFile(result.filePath, data, function(err) {
			  if (err) {
				fs.unlink(tempDir + '/'+arg.name+'.zip', (err) => {
				  if (err) {
					console.error(err)
					return
				  }
				})
			  } else {
				fs.unlink(tempDir + '/'+arg.name+'.zip', (err) => {
				  if (err) {
					console.error(err)
					return
				  }
				})
			  };
			})
		  } else {
			fs.unlink(tempDir + '/'+arg.name+'.zip', (err) => {
			  if (err) {
				console.error(err)
				return
			  }
			})
		  }
		})
	});

	const archive = archiver('zip', {
		lib: { level: 9 } // Sets the compression level.
	});
		
	archive.on('error', function(err) {
		throw err;
	});

	archive.pipe(output)
	
	Jimp.read(buffer, (err, fir_img) => {
		if(err) {
			console.log(err);
		} else {
			var watermark = fs.readFileSync(__dirname + "/images/jm_watermark.png", {encoding: 'base64'});
			var buffer = Buffer.from(watermark, 'base64');
			Jimp.read(buffer, (err, sec_img) => {
				if(err) {
					console.log(err);
				} else {
					fir_img.composite(sec_img, 0, 0);
					fir_img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
						const finalImage = Buffer.from(buffer);
						archive.append(finalImage, {name: arg.name+".png"})
						archive.append(json, {name: arg.name+".jrs"})
						archive.finalize()
						});
					
				}
			})
		}
	}); 
})

ipcMain.on('load-jersey', (event, arg) => {
	const file = dialog.showOpenDialogSync(null, {
		properties: ['openFile'],
		filters: [
			{ name: 'Jersey Files', extensions: ['jrs'] }
		]
	})

	event.sender.send('load-jersey-response', JSON.stringify(JSON.parse(fs.readFileSync(file[0]).toString())))
})

ipcMain.on('remove-border', (event, arg) => {
	var buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var fuzz = parseInt(arg.fuzz);
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.autocrop()
			image.getBase64(Jimp.AUTO, (err, ret) => {
				console.log(ret)
				event.sender.send('imagemagick-response', ret)
			})
		}
	})
})

ipcMain.on('replace-color', (event, arg) => {	
	var buffer = Buffer.from(arg.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.getBase64(Jimp.AUTO, (err, ret) => {
				event.sender.send('imagemagick-response', ret)
			})
		}
	})
})

ipcMain.on('warp-text', (event, arg) => {
	var buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var amount = arg.amount;
	var deform = arg.deform;
	var width;
	var height;
	var cmdLine;
	console.log(arg.deform)
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.autocrop();
			image.write(tempDir+"/temp.png");
			width = image.bitmap.width;
			height = image.bitmap.height;
			console.log(width +'x'+height)
			switch (deform) {
				case "arch":
					cmdLine = 'magick convert -background transparent -wave -'+amount+'x'+width*2+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png'
					break;
				case "arc":
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel Background -background transparent -distort Arc '+amount+' -trim +repage '+tempDir+'/'+deform+'.png'
					break;
				case "bilinearUp":
					console.log(amount)
					console.log(((100-amount)*0.01));
					var y2=height*((100-amount)*0.01)
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel transparent -interpolate Spline -distort BilinearForward "0,0 0,0 0,'+height+' 0,'+height+' '+width+',0 '+width+',0 '+width+','+height+' '+width+','+y2+'" '+tempDir+'/'+deform+'.png'
					break;
				case "bilinearDown":
					console.log(amount)
					console.log(((100-amount)*0.01));
					var y2=height*((100-amount)*0.01)
					cmdLine = 'magick convert '+tempDir+'/temp.png -virtual-pixel transparent -interpolate Spline -distort BilinearForward "0,0 0,0 0,'+height+' 0,'+y2+' '+width+',0 '+width+',0 '+width+','+height+' '+width+','+height+'" '+tempDir+'/'+deform+'.png'
					break;
				case "archUp":
					imagemagickCli.exec('magick convert '+tempDir+'/temp.png -gravity west -background transparent -extent '+width*2+'x'+height+' '+tempDir+'/temp.png').then(({stdout, stderr }) => {
						imagemagickCli.exec('magick convert -background transparent -wave -'+amount*2+'x'+width*4+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png').then(({ stdout, stderr }) => {
							Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
								if (err) {
									console.log(err);
								} else {
									image.getBase64(Jimp.AUTO, (err, ret) => {
										event.sender.send('warp-text-response', ret)
									})
								}
							})
						})
					})
					break;
				case "archDown":
					imagemagickCli.exec('magick convert '+tempDir+'/temp.png -gravity east -background transparent -extent '+width*2+'x'+height+' '+tempDir+'/temp.png').then(({stdout, stderr }) => {
						imagemagickCli.exec('magick convert -background transparent -wave -'+amount*2+'x'+width*4+' -trim +repage '+tempDir+'/temp.png '+tempDir+'/'+deform+'.png').then(({ stdout, stderr }) => {
							Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
								if (err) {
									console.log(err);
								} else {
									image.getBase64(Jimp.AUTO, (err, ret) => {
										event.sender.send('warp-text-response', ret)
									})
								}
							})
						})
					})
					break;
				default:
					image.getBase64(Jimp.AUTO, (err, ret) => {
						event.sender.send('warp-text-response', ret)
					})
					break;
			}
			console.log(cmdLine);
			imagemagickCli.exec(cmdLine).then(({ stdout, stderr }) => {
				Jimp.read(tempDir+'/'+deform+'.png', (err, image) => {
					if (err) {
						console.log(err);
					} else {
						image.getBase64(Jimp.AUTO, (err, ret) => {
							event.sender.send('warp-text-response', ret)
						})
					}
				})
			})
		}
	})
})

ipcMain.on('custom-font', (event, arg) => {
	let json = {}
	dialog.showOpenDialog(null, {
		properties: ['openFile'],
		filters: [
			{ name: 'Fonts', extensions: ['ttf', 'otf'] }
		]
	}).then(result => {
		if(!result.canceled) {
			ttfInfo(result.filePaths[0], function(err, info) {
			var ext = getExtension(result.filePaths[0])
				//const dataUrl = font2base64.encodeToDataUrlSync(result.filePaths[0])
				var fontPath = url.pathToFileURL(tempDir + '/'+path.basename(result.filePaths[0]))
				fs.copyFile(result.filePaths[0], tempDir + '/'+path.basename(result.filePaths[0]), (err) => {
					if (err) {
						console.log(err)
					} else {
						json.fontName = info.tables.name[1],
						json.fontStyle = info.tables.name[2],
						json.familyName = info.tables.name[6],
						json.fontFormat = ext,
						json.fontMimetype = 'font/' + ext,
						json.fontData = fontPath.href,
						json.fontBase64 = ""
						event.sender.send('custom-font-response', json)
					}
				})
			});
		}
	}).catch(err => {
		console.log(err)
	})
})

ipcMain.on('set-preference', (event, arg) => {
	store.set(arg.pref, arg.val)
})

function getExtension(filename) {
	var ext = path.extname(filename||'').split('.');
	return ext[ext.length - 1];
  }

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1280,
      height: 950,
	  icon: (__dirname + '/images/jersey.png'),
      webPreferences: {
		nodeIntegration: true,
	  	contextIsolation: false 
	  }
    })

	const template = [
		// { role: 'appMenu' }
		...(isMac ? [{
			label: app.name,
			submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'services' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' }
			]
		}] : []),
		// { role: 'fileMenu' }
		{
			label: 'File',
			submenu: [
			{
				click: () => mainWindow.webContents.send('load-jersey','click'),
				accelerator: process.platform === 'darwin' ? 'Cmd+L' : 'Control+L',
				label: 'Load Jersey',
			},
			{
				click: () => mainWindow.webContents.send('save-jersey','click'),
				accelerator: process.platform === 'darwin' ? 'Cmd+S' : 'Control+S',
				label: 'Save Jersey',
			},
			isMac ? { role: 'close' } : { role: 'quit' }
			]
		},
		// { role: 'viewMenu' }
		{
			label: 'View',
			submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
			]
		},
		// { role: 'windowMenu' }	
		{
			label: 'About',
			submenu: [
			{
				click: () => mainWindow.webContents.send('about','click'),
					label: 'About the OOTP Jersey Maker',
			},
			{
				label: 'About OOTP Baseball',
				click: async () => {    
				await shell.openExternal('https://www.ootpdevelopments.com/out-of-the-park-baseball-home/')
				}
			},
			{
				label: 'About Node.js',
				click: async () => {    
				await shell.openExternal('https://nodejs.org/en/about/')
				}
			},
			{
				label: 'About Electron',
				click: async () => {
				await shell.openExternal('https://electronjs.org')
				}
			},
			{
				label: 'View project on GitHub',
				click: async () => {
				await shell.openExternal('https://github.com/eriqjaffe/OOTP-Jersey-Maker')
				}
			}
			]
		}
	]
		
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
  
    mainWindow.loadURL(`file://${__dirname}/index.html?&preferredColorFormat=${preferredColorFormat}&preferredTexture=${preferredTexture}`);

	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
  
    // Open the DevTools.
	//mainWindow.maximize()
    //mainWindow.webContents.openDevTools()
  }

  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })