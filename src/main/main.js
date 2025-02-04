const { app, BrowserWindow, ipcMain } = require('electron');
const { dialog } = require('electron/main');
const path = require('path');
const ChickenDB = require('./database');

class ChickenTracker {
    constructor() {
        this.db = new ChickenDB();
        this.window = null;
        this.setupIpcHandlers();
    }

    createWindow() {
        this.window = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '..', 'preload.js')
            }
        });

        this.window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
        this.window.webContents.openDevTools();
    }

    setupIpcHandlers() {
        ipcMain.handle('reset-window-focus', async () => {
            try {
                this.window.blur();
                this.window.focusOnWebView();
                return true;
            } catch (error) {
                console.error('Error resetting focus:', error);
                return false;
            }
        });

        ipcMain.handle('add-chicken', async (event, chicken) => {
            try {
                return await this.db.addChicken(chicken);
            } catch (error) {
                console.error('Error adding chicken:', error);
                throw error;
            }
        });

        ipcMain.handle('get-chickens', async () => {
            try {
                return await this.db.getChickens();
            } catch (error) {
                console.error('Error getting chickens:', error);
                throw error;
            }
        });

        ipcMain.handle('delete-chicken', async (event, id) => {
            try {
                return await this.db.deleteChicken(id);
            } catch (error) {
                console.error('Error deleting chicken:', error);
                throw error;
            }
        });

        ipcMain.handle('add-note', async (event, { chickenId, note }) => {
            try {
                return await this.db.addNote(chickenId, note);
            } catch (error) {
                console.error('Error adding note:', error);
                throw error;
            }
        });

        ipcMain.handle('get-notes', async (event, chickenId) => {
            try {
                return await this.db.getNotes(chickenId);
            } catch (error) {
                console.error('Error getting notes:', error);
                throw error;
            }
        });

        ipcMain.handle('open-file-dialog', async () => {
            if (!this.window) {
                throw new Error('Window not initialized');
            }

            try {
                const result = await dialog.showOpenDialog({
                    title: 'Select Images',
                    properties: ['openFile', 'multiSelections'],
                    filters: [
                        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
                    ]
                });
                console.log('File dialog result:', result);
                return result;
            } catch (error) {
                console.error('Error showing file dialog:', error);
                throw error;
            }
        });

        ipcMain.handle('add-image', async (event, { chickenId, imagePath }) => {
            try {
                console.log('Adding image:', { chickenId, imagePath });
                return await this.db.addImage(chickenId, imagePath);
            } catch (error) {
                console.error('Error adding image:', error);
                throw error;
            }
        });

        ipcMain.handle('get-chicken-images', async (event, chickenId) => {
            try {
                return await this.db.getChickenImages(chickenId);
            } catch (error) {
                console.error('Error getting chicken images:', error);
                throw error;
            }
        });

        ipcMain.handle('delete-image', async (event, imageId) => {
            try {
                return await this.db.deleteImage(imageId);
            } catch (error) {
                console.error('Error deleting image:', error);
                throw error;
            }
        });

        ipcMain.handle('set-primary-image', async (event, { imageId, chickenId }) => {
            try {
                return await this.db.setPrimaryImage(imageId, chickenId);
            } catch (error) {
                console.error('Error setting primary image:', error);
                throw error;
            }
        });
    }

    init() {
        app.whenReady().then(() => {
            this.createWindow();

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }
}

const chickenTracker = new ChickenTracker();
chickenTracker.init();