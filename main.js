const { app, BrowserWindow, dialog, Menu, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs');
const url = require('url');
const Jimp = require('jimp');
const { distortUnwrap } = require('@alxcube/lens')
require('@alxcube/lens-jimp');
const ttfInfo = require('ttfinfo');
const isMac = process.platform === 'darwin'
const os = require('os');
const tempDir = os.tmpdir()
const archiver = require('archiver')
const Store = require("electron-store")
const fontname = require('fontname')

const store = new Store();

const preferredColorFormat = store.get("preferredColorFormat", "hex")
const preferredTexture = store.get("preferredTexture", "default_jersey_texture")
const userFontsFolder = path.join(app.getPath('userData'),"fonts")
if (!fs.existsSync(userFontsFolder)) {
    fs.mkdirSync(userFontsFolder);
}

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
	let buffer = Buffer.from(arg.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	let amount = arg.amount;
	let deform = arg.deform;
	try {
		switch (deform) {
			case "arch":
				arch()
				async function arch() {
					try {
						let image = await Jimp.read(buffer);
						const newImage = new Jimp(image.bitmap.width, image.bitmap.height);
						image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
							const radians = x / image.bitmap.width * 360 * Math.PI / 180;
							const offsetY = (amount * -1) * Math.cos(radians);
							const newY = y + offsetY;
						
							const yFloor = Math.floor(newY);
							const yCeil = Math.ceil(newY);
							const yWeight = newY - yFloor;
						
							const clampedYFloor = Math.max(0, Math.min(image.bitmap.height - 1, yFloor));
							const clampedYCeil = Math.max(0, Math.min(image.bitmap.height - 1, yCeil));
						
							const colorFloor = Jimp.intToRGBA(image.getPixelColor(x, clampedYFloor));
							const colorCeil = Jimp.intToRGBA(image.getPixelColor(x, clampedYCeil));
						
							const r = colorFloor.r * (1 - yWeight) + colorCeil.r * yWeight;
							const g = colorFloor.g * (1 - yWeight) + colorCeil.g * yWeight;
							const b = colorFloor.b * (1 - yWeight) + colorCeil.b * yWeight;
							const a = colorFloor.a * (1 - yWeight) + colorCeil.a * yWeight;
						
							const interpolatedColor = Jimp.rgbaToInt(r, g, b, a);
							newImage.setPixelColor(interpolatedColor, x, y);
						});
						newImage.autocrop()
						let b64 = await newImage.getBase64Async(Jimp.AUTO)
						event.sender.send('warp-text-response', b64)
					} catch (error) {
						console.error('Error applying wave effect:', error);
						return null;
					}
				}
				break;
			case "arc":
				arc()
				async function arc() {
					let image = await Jimp.read(buffer)
					image.autocrop()
					let result = await distortUnwrap(image, "Arc", [parseInt(amount)])
					let tempImg = await new Jimp(result.bitmap.width*4, result.bitmap.height*4)
					await tempImg.blit(result, 5, 5)
					await tempImg.autocrop()
					let b64 = await tempImg.getBase64Async(Jimp.AUTO)
					event.sender.send('warp-text-response', b64)
				}
				break;
			case "bilinearUp":
				bilinearUp()
				async function bilinearUp() {
					let image = await Jimp.read(buffer)
					await image.autocrop()
					const y2=image.bitmap.height*((100-amount)*0.01)
					const controlPoints = [1.5,0,0,0,0,0,image.bitmap.height,0,image.bitmap.height,image.bitmap.width,0,image.bitmap.width,0,image.bitmap.width,image.bitmap.height,image.bitmap.width,y2]
					const result = await distortUnwrap(image, "Polynomial", controlPoints)
					const tempImg = await new Jimp(result.bitmap.width*4, result.bitmap.height*4)
					await tempImg.blit(result, 5, 5)
					await tempImg.autocrop()
					let b64 = await tempImg.getBase64Async(Jimp.AUTO)
					event.sender.send('warp-text-response', b64)
				}
				break;
			case "bilinearDown":
				bilinearDown()
				async function bilinearDown() {
					let image = await Jimp.read(buffer)
					await image.autocrop()
					const y2=image.bitmap.height*((100-amount)*0.01)
					const controlPoints = [1.5,0,0,0,0,0,image.bitmap.height,0,y2,image.bitmap.width,0,image.bitmap.width,0,image.bitmap.width,image.bitmap.height,image.bitmap.width,image.bitmap.height]
					const result = await distortUnwrap(image, "Polynomial", controlPoints)
					const tempImg = await new Jimp(result.bitmap.width*4, result.bitmap.height*4)
					await tempImg.blit(result, 5, 5)
					await tempImg.autocrop()
					let b64 = await tempImg.getBase64Async(Jimp.AUTO)
					event.sender.send('warp-text-response', b64)
				}
				break;
			case "archUp":
				archUp()
				async function archUp() {
					try {
						let image = await Jimp.read(buffer);
						const tempImage = new Jimp(image.bitmap.width * 2, image.bitmap.height)
						tempImage.blit(image, 0, 0, 0, 0, image.bitmap.width, image.bitmap.height);
						const newImage = new Jimp(image.bitmap.width, image.bitmap.height);
						tempImage.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
							const radians = (x * 180) / image.bitmap.width * Math.PI / 180;
							const offsetY = (amount * -1) * Math.cos(radians);
							const newY = y + offsetY;
						
							const yFloor = Math.floor(newY);
							const yCeil = Math.ceil(newY);
							const yWeight = newY - yFloor;
						
							const clampedYFloor = Math.max(0, Math.min(image.bitmap.height - 1, yFloor));
							const clampedYCeil = Math.max(0, Math.min(image.bitmap.height - 1, yCeil));
						
							const colorFloor = Jimp.intToRGBA(image.getPixelColor(x, clampedYFloor));
							const colorCeil = Jimp.intToRGBA(image.getPixelColor(x, clampedYCeil));
						
							const r = colorFloor.r * (1 - yWeight) + colorCeil.r * yWeight;
							const g = colorFloor.g * (1 - yWeight) + colorCeil.g * yWeight;
							const b = colorFloor.b * (1 - yWeight) + colorCeil.b * yWeight;
							const a = colorFloor.a * (1 - yWeight) + colorCeil.a * yWeight;
						
							const interpolatedColor = Jimp.rgbaToInt(r, g, b, a);
							newImage.setPixelColor(interpolatedColor, x, y);
						});
						
						newImage.autocrop();
						
						let b64 = await newImage.getBase64Async(Jimp.AUTO)
						event.sender.send('warp-text-response', b64)
					} catch (error) {
						console.error('Error applying wave effect:', error);
						return null;
					}
				}
				break;
			case "archDown":
				archDown()
				async function archDown() {
					try {
						let image = await Jimp.read(buffer);
						const tempImage = new Jimp(image.bitmap.width * 2, image.bitmap.height)
						tempImage.blit(image, image.bitmap.width, 0, 0, 0, image.bitmap.width, image.bitmap.height);
						const newImage = new Jimp(image.bitmap.width, image.bitmap.height);
						tempImage.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
							const radians = (x * 180) / image.bitmap.width * Math.PI / 180;
							const offsetY = amount * Math.cos(radians);
							const newY = y + offsetY;
						
							const yFloor = Math.floor(newY);
							const yCeil = Math.ceil(newY);
							const yWeight = newY - yFloor;
						
							const clampedYFloor = Math.max(0, Math.min(image.bitmap.height - 1, yFloor));
							const clampedYCeil = Math.max(0, Math.min(image.bitmap.height - 1, yCeil));
						
							const colorFloor = Jimp.intToRGBA(image.getPixelColor(x, clampedYFloor));
							const colorCeil = Jimp.intToRGBA(image.getPixelColor(x, clampedYCeil));
						
							const r = colorFloor.r * (1 - yWeight) + colorCeil.r * yWeight;
							const g = colorFloor.g * (1 - yWeight) + colorCeil.g * yWeight;
							const b = colorFloor.b * (1 - yWeight) + colorCeil.b * yWeight;
							const a = colorFloor.a * (1 - yWeight) + colorCeil.a * yWeight;
						
							const interpolatedColor = Jimp.rgbaToInt(r, g, b, a);
							newImage.setPixelColor(interpolatedColor, x, y);
						});						
						newImage.autocrop()
						let b64 = await newImage.getBase64Async(Jimp.AUTO)
						event.sender.send('warp-text-response', b64)
					} catch (error) {
						console.error('Error applying wave effect:', error);
						return null;
					}
				}
				break;
			default:
				Jimp.read(buffer, (err, image) => {
					image.getBase64(Jimp.AUTO, (err, ret) => {
						event.sender.send('warp-text-response', b64)
					})
				})
				break;		
		}
	} catch (err) {
		console.log(err)
		image.getBase64(Jimp.AUTO, (err, ret) => {
			event.sender.send('warp-text-response', b64)
		})
	}
})	

ipcMain.on('custom-font', (event, arg) => {
	let json = {}
	const options = {
		defaultPath: store.get("uploadFontPath", app.getPath('desktop')),
		properties: ['openFile'],
		filters: [
			{ name: 'Fonts', extensions: ['ttf', 'otf'] }
		]
	}
	dialog.showOpenDialog(null, options).then(result => {
		if(!result.canceled) {
			store.set("uploadFontPath", path.dirname(result.filePaths[0]))
			const filePath = path.join(userFontsFolder,path.basename(result.filePaths[0]))
			try {
				const fontMeta = fontname.parse(fs.readFileSync(result.filePaths[0]))[0];
				var ext = getExtension(result.filePaths[0])
				var fontPath = url.pathToFileURL(result.filePaths[0])
				json.status = "ok"
				json.fontName = fontMeta.fullName
				json.fontStyle = fontMeta.fontSubfamily
				json.familyName = fontMeta.fontFamily
				json.fontFormat = ext
				json.fontMimetype = 'font/' + ext
				json.fontData = fontPath.href
				json.fontPath = filePath
				fs.copyFileSync(result.filePaths[0], filePath)
				event.sender.send('custom-font-response', json)
			} catch (err) {
				json.status = "error"
				json.fontName = path.basename(result.filePaths[0])
				json.fontPath = result.filePaths[0]
				json.message = err
				event.sender.send('custom-font-response', json)
				fs.unlinkSync(result.filePaths[0])
			}
		} else {
			json.status = "cancelled"
			event.sender.send('custom-font-response', json)
			log.info("User cancelled custom font dialog")
		}
	}).catch(err => {
		console.log(err)
		json.status = "error",
		json.message = err
		event.sender.send('custom-font-response', json)
	})
})

ipcMain.on('local-font-folder', (event, arg) => {
	const jsonObj = {}
	const jsonArr = []

	filenames = fs.readdirSync(userFontsFolder);
	for (i=0; i<filenames.length; i++) {
		if (path.extname(filenames[i]).toLowerCase() == ".ttf" || path.extname(filenames[i]).toLowerCase() == ".otf") {
			const filePath = path.join(userFontsFolder,filenames[i])
			try {
				const fontMeta = fontname.parse(fs.readFileSync(filePath))[0];
				var ext = getExtension(filePath)
				var fontPath = url.pathToFileURL(filePath)
				var json = {
					"status": "ok",
					"fontName": fontMeta.fullName,
					"fontStyle": fontMeta.fontSubfamily,
					"familyName": fontMeta.fontFamily,
					"fontFormat": ext,
					"fontMimetype": 'font/' + ext,
					"fontData": fontPath.href,
					"fontPath": filePath,
				};
				jsonArr.push(json)
			} catch (err) {
				const json = {
					"status": "error",
					"fontName": path.basename(filePath),
					"fontPath": filePath,
					"message": err
				}
				jsonArr.push(json)
				fs.unlinkSync(filePath)
			}
		}
	}
	jsonObj.result = "success"
	jsonObj.fonts = jsonArr
	event.sender.send('local-font-folder-response', jsonObj)
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