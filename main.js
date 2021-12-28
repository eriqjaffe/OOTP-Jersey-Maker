const { app, BrowserWindow, dialog, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs');
const express = require('express');
const Jimp = require('jimp');
const imagemagickCli = require('imagemagick-cli');
const ttfInfo = require('ttfinfo');
const isMac = process.platform === 'darwin'
const os = require('os');
const tempDir = os.tmpdir()
const app2 = express()
const port = 8080;
const watermark = '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gAAAAAAABAAAAAAgAAAAAAABAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAEAAAAACAAAAAAAAEAAAAACAAAAAAAAEAAAAACAAAAABAAAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAACAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAAABAAAAAAgAAAAAQAAAAAAAAgAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAAAAQAAAAAIAAAAAEAAAAAAAAIAAAAAAQAAAAAIAAAAAEAAAAAAwMuM/y/AAFJ5/388Lqs9AAAAAElFTkSuQmCC';

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
	label: 'Window',
	submenu: [
	{ role: 'minimize' },
	{ role: 'zoom' },
	...(isMac ? [
		{ type: 'separator' },
		{ role: 'front' },
		{ type: 'separator' },
		{ role: 'window' }
	] : [
		{ role: 'close' }
	])
	]
},
{
	role: 'help',
	submenu: [
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
		await shell.openExternal('https://github.com/eriqjaffe/jerseymaker')
		}
	}
	]
}
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

app2.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app2.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));

app2.get("/uploadImage", (req, res) => {
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
						res.json({
							"filename": path.basename(result.filePaths[0]),
							"image": ret
						  });
						res.end();
					})
				}
			});
		  }
	  }).catch(err => {
		console.log(err)
	  })
})

app2.post('/saveJersey', (req, res) => {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');

	const options = {
		defaultPath: app.getPath('desktop') + '/' + req.body.name,
	}

	dialog.showSaveDialog(null, options).then((result) => {
		if (!result.canceled) {
			Jimp.read(buffer, (err, fir_img) => {
			if(err) {
				console.log(err);
			} else {
				var buffer = Buffer.from(watermark, 'base64');
					Jimp.read(buffer, (err, sec_img) => {
						if(err) {
							console.log(err);
						} else {
							fir_img.composite(sec_img, 0, 0);
							fir_img.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
								const finalImage = Buffer.from(buffer).toString('base64');
								fs.writeFile(result.filePath, finalImage, 'base64', function(err) {
									console.log(err);
								});
							  });
							
						}
					})
				}
			});
		} 
	}).catch((err) => {
		console.log(err);
	});
});

app2.post("/removeBorder", (req, res) => {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var fuzz = parseInt(req.body.fuzz);
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.write("temp.png");
			imagemagickCli.exec('magick convert -trim -fuzz '+fuzz+'% temp.png temp.png').then(({ stdout, stderr }) => {
				Jimp.read("temp.png", (err, image) => {
					if (err) {
						console.log(err);
					} else {
						image.getBase64(Jimp.AUTO, (err, ret) => {
							res.end(ret);
						})
					}
				})
			})
		}
	})
})

app2.post("/replaceColor", (req, res) => {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var x = parseInt(req.body.x);
	var y = parseInt(req.body.y);
	var color = req.body.color;
	var newcolor = req.body.newcolor;
	var action = req.body.action;
	var fuzz = parseInt(req.body.fuzz);
	var cmdString;
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.write("temp.png");
			if (action == "replaceColorRange") {
				cmdString = 'magick convert temp.png -fuzz '+fuzz+'% -fill '+newcolor+' -draw "color '+x+','+y+' floodfill" temp.png';		
			} else {
				cmdString = 'magick convert temp.png -fuzz '+fuzz+'% -fill '+newcolor+' -opaque '+color+' temp.png';	
			}
			imagemagickCli.exec(cmdString).then(({ stdout, stderr }) => {
				Jimp.read("temp.png", (err, image) => {
					if (err) {
						console.log(err);
					} else {
						image.getBase64(Jimp.AUTO, (err, ret) => {
							res.end(ret);
						})
					}
				})
			})
		}
	})
})

app2.post("/removeColorRange", (req, res) => {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var x = parseInt(req.body.x);
	var y = parseInt(req.body.y);
	var fuzz = parseInt(req.body.fuzz);
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.write("temp.png", (err) => {
				imagemagickCli.exec('magick convert temp.png -fuzz '+fuzz+'% -fill none -draw "color '+x+','+y+' floodfill" temp.png').then(({ stdout, stderr }) => {
					Jimp.read("temp.png", (err, image) => {
						if (err) {
							console.log(err);
						} else {
							image.getBase64(Jimp.AUTO, (err, ret) => {
								res.end(ret);
							})
						}
					})
				})
			})
		}
 	})
})

app2.post('/removeAllColor', (req, res) => {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var x = parseInt(req.body.x);
	var y = parseInt(req.body.y);
	var color = req.body.color;
	var fuzz = parseInt(req.body.fuzz);
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);		
		} else {
			image.write("temp.png", (err) => {
				var cmdString = 'magick convert temp.png -fuzz '+fuzz+'% -transparent '+color+' temp.png';
				imagemagickCli.exec(cmdString).then(({ stdout, stderr }) => {
					Jimp.read("temp.png", (err, image) => {
						if (err) {
							console.log(err);
						} else {
							image.getBase64(Jimp.AUTO, (err, ret) => {
								res.end(ret);
							})
						}
					})
				})
			})
		}
	})
});

app2.post('/warpText', (req, res)=> {
	var buffer = Buffer.from(req.body.imgdata.replace(/^data:image\/(png|gif|jpeg);base64,/,''), 'base64');
	var amount = req.body.amount;
	var deform = req.body.deform;
	var width;
	var height;
	var cmdLine;
	console.log(req.body.deform)
	Jimp.read(buffer, (err, image) => {
		if (err) {
			console.log(err);
		} else {
			image.autocrop();
			image.write("tmp2.png")
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
										res.end(ret);
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
										res.end(ret);
									})
								}
							})
						})
					})
					break;
				default:
					image.getBase64(Jimp.AUTO, (err, ret) => {
						res.end(ret);
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
							res.end(ret);
						})
					}
				})
			})
		}
	})
})

app2.get("/customFont", (req, res) => {
	dialog.showOpenDialog(null, {
		properties: ['openFile'],
		filters: [
			{ name: 'Fonts', extensions: ['ttf', 'otf', 'woff', 'woff2'] }
		]
	}).then(result => {
		if(!result.canceled) {
			ttfInfo(result.filePaths[0], function(err, info) {
			var ext = getExtension(result.filePaths[0])
				var buff = fs.readFileSync(result.filePaths[0]);
				fs.copyFile(result.filePaths[0], __dirname + '/fonts/'+path.basename(result.filePaths[0]), (err) => {
					if (err) {
						console.log(err)
					} else {
						res.json({
							"fontName": info.tables.name[1],
							"fontStyle": info.tables.name[2],
							"familyName": info.tables.name[6],
							"fontFormat": ext,
							"fontMimetype": 'font/' + ext,
							"fontData": path.basename(result.filePaths[0])
						});
						res.end()
					}
				})
				/* fs.writeFile(__dirname + '/fonts/'+path.basename(result.filePaths[0]), buff, function (err) {
					if (err) return console.log(err);
					res.json({
						"fontName": info.tables.name[1],
						"fontStyle": info.tables.name[2],
						"familyName": info.tables.name[6],
						"fontFormat": ext,
						"fontMimetype": 'font/' + ext,
						"fontData": 'data:'+'font/' + ext+';charset=ascii;base64,' + buff.toString('base64')
					});
				  });
				
			res.end() */
			});
		}
	}).catch(err => {
		console.log(err)
	})
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
        //preload: path.join(__dirname, 'preload.js')
      }
    })
  
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

	mainWindow.webContents.on('new-window', function(e, url) {
		e.preventDefault();
		require('electron').shell.openExternal(url);
	});
  
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
  }
  
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  
  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.