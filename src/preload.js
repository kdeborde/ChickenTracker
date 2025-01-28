const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    addChicken: (chicken) => ipcRenderer.invoke('add-chicken', chicken),
    getChickens: () => ipcRenderer.invoke('get-chickens'),
    deleteChicken: (id) => ipcRenderer.invoke('delete-chicken', id),
    addNote: (chickenId, note) => ipcRenderer.invoke('add-note', { chickenId, note }),
    getNotes: (chickenId) => ipcRenderer.invoke('get-notes', chickenId)
});