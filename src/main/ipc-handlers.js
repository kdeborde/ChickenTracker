const { ipcMain } = require('electron');

function setupIpcHandlers(db) {
    ipcMain.handle('add-chicken', async (event, chicken) => {
        try {
            return await db.addChicken(chicken);
        } catch (error) {
            console.error('Error adding chicken:', error);
            throw error;
        }
    });

    ipcMain.handle('get-chickens', async () => {
        try {
            return await db.getChickens();
        } catch (error) {
            console.error('Error getting chickens:', error);
            throw error;
        }
    });
}

module.exports = setupIpcHandlers;