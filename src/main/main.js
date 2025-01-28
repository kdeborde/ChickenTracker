const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ChickenDB = require('./database');

class ChickenTracker {
    constructor() {
        this.db = new ChickenDB();
        this.window = null;
        this.setupIpcHandlers();
    }

    setupIpcHandlers() {
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
    }

    createWindow() {
        this.window = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../preload.js')
            }
        });

        this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
        this.window.webContents.openDevTools();
    }

    init() {
        app.whenReady().then(() => {
            this.createWindow();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });
    }
}

const chickenTracker = new ChickenTracker();
chickenTracker.init();