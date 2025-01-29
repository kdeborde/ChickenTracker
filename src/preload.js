const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    addChicken: (chicken) => ipcRenderer.invoke('add-chicken', chicken),
    getChickens: () => ipcRenderer.invoke('get-chickens'),
    deleteChicken: (id) => ipcRenderer.invoke('delete-chicken', id),
    addNote: (chickenId, note) => ipcRenderer.invoke('add-note', { chickenId, note }),
    getNotes: (chickenId) => ipcRenderer.invoke('get-notes', chickenId),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
    addImage: (chickenId, imagePath) => {
        console.log('Sending image path:', imagePath);
        return ipcRenderer.invoke('add-image', { chickenId, imagePath });
    },
    getChickenImages: (chickenId) => ipcRenderer.invoke('get-chicken-images', chickenId),
    deleteImage: (imageId) => ipcRenderer.invoke('delete-image', imageId),
    setPrimaryImage: (imageId, chickenId) => ipcRenderer.invoke('set-primary-image', { imageId, chickenId })
});