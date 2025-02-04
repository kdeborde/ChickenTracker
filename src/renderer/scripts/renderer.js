class ChickenUI {
    constructor() {
        this.modal = document.getElementById('chickenModal');
        this.form = document.getElementById('chickenForm');
        this.addButton = document.getElementById('addChickenBtn');
        this.cancelButton = document.getElementById('cancelBtn');
        this.mainContent = document.querySelector('.main-content');

        this.bindEvents();
        this.loadDashboard(); // Load dashboard immediately
    }

    bindEvents() {
        // Modal events
        this.cancelButton.addEventListener('click', () => this.closeModal());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Navigation events
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.getAttribute('data-page');

                // Update active state
                document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
                e.target.classList.add('active');

                this.navigate(page);
            });
        });

        // Close modal if clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
    }

    navigate(page) {
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'all-chickens':
                this.loadAllChickens();
                break;
            case 'add-chicken':
                this.openModal();
                break;
        }
    }

    async loadDashboard() {
        try {
            const chickens = await window.electronAPI.getChickens();

            // Group chickens by sex
            const hens = chickens.filter(c => c.sex === 'hen');
            const roosters = chickens.filter(c => c.sex === 'rooster');
            const unknown = chickens.filter(c => !c.sex);

            this.mainContent.innerHTML = `
                <div class="content-header">
                    <h1>Dashboard</h1>
                    <button class="btn" id="addChickenBtn">+ Add Chicken</button>
                </div>
    
                <div class="dashboard-stats">
                    <div class="stat-card">
                        <h3>Total Chickens</h3>
                        <p>${chickens.length}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Hens</h3>
                        <p>${hens.length}</p>
                    </div>
                    <div class="stat-card">
                        <h3>Roosters</h3>
                        <p>${roosters.length}</p>
                    </div>
                </div>
    
                ${hens.length > 0 ? `
                    <div class="section">
                        <h2>Hens</h2>
                        <div class="chicken-grid">
                            ${hens.map(chicken => this.createChickenCard(chicken)).join('')}
                        </div>
                    </div>
                ` : ''}
    
                ${roosters.length > 0 ? `
                    <div class="section">
                        <h2>Roosters</h2>
                        <div class="chicken-grid">
                            ${roosters.map(chicken => this.createChickenCard(chicken)).join('')}
                        </div>
                    </div>
                ` : ''}
    
                ${unknown.length > 0 ? `
                    <div class="section">
                        <h2>Unknown</h2>
                        <div class="chicken-grid">
                            ${unknown.map(chicken => this.createChickenCard(chicken)).join('')}
                        </div>
                    </div>
                ` : ''}
            `;

            // Rebind events
            this.addButton = document.getElementById('addChickenBtn');
            if (this.addButton) {
                this.addButton.addEventListener('click', () => this.openModal());
            }

            // Bind events for all chicken cards
            this.bindChickenCardEvents();

        } catch (error) {
            console.error('Error loading dashboard:', error);
            alert('Failed to load dashboard');
        }
    }

    async loadAllChickens() {
        try {
            const chickens = await window.electronAPI.getChickens();

            this.mainContent.innerHTML = `
                <div class="content-header">
                    <h1>All Chickens</h1>
                    <button class="btn" id="addChickenBtn">+ Add Chicken</button>
                </div>
                <div class="table-container">
                    <table class="chicken-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Sex</th>
                                <th>Species</th>
                                <th>Birthday</th>
                                <th>Age</th>
                                <th>Latest Note</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${chickens.map(chicken => `
                                <tr>
                                    <td><a href="#" class="chicken-name-link" data-id="${chicken.id}">${chicken.name}</a></td>
                                    <td>${chicken.sex || 'Unknown'}</td>
                                    <td>${chicken.species || 'Unknown'}</td>
                                    <td>${chicken.birthday || 'Unknown'}</td>
                                    <td>${chicken.birthday ? this.calculateAge(chicken.birthday) : 'Unknown'}</td>
                                    <td>${chicken.latest_note || '-'}</td>
                                    <td>
                                        <button class="btn btn-small add-note-btn" data-id="${chicken.id}">Add Note</button>
                                        <button class="btn btn-small btn-delete" data-id="${chicken.id}">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Rebind events
            this.addButton = document.getElementById('addChickenBtn');
            this.addButton.addEventListener('click', () => this.openModal());
            this.bindChickenCardEvents();
        } catch (error) {
            console.error('Error loading all chickens:', error);
            alert('Failed to load chickens');
        }
    }

    openModal() {
        this.modal.classList.add('active');
        setTimeout(() => {
            const nameInput = document.getElementById('name');
            if (nameInput) {
                nameInput.focus();
            }
        }, 10);
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.form.reset();
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            species: document.getElementById('species').value,
            sex: document.getElementById('sex').value,
            birthday: document.getElementById('birthday').value,
            notes: document.getElementById('notes').value,
            photoPath: document.getElementById('photo').files[0]?.path
        };

        try {
            await window.electronAPI.addChicken(formData);
            this.closeModal();
            this.loadDashboard();
        } catch (error) {
            console.error('Error adding chicken:', error);
            alert('Failed to add chicken');
        }
    }

    createChickenCard(chicken) {
        const cardHtml = `
            <div class="chicken-card">
                <div class="chicken-image">
                    ${chicken.photoData
                ? `<img src="${chicken.photoData}" alt="${chicken.name}">`
                : '🐔'}
                </div>
                <div class="chicken-info">
                    <h3><a href="#" class="chicken-name-link" data-id="${chicken.id}">${chicken.name}</a></h3>
                    <p><strong>Sex:</strong> ${chicken.sex || 'Unknown'}</p>
                    <p><strong>Species:</strong> ${chicken.species || 'Unknown'}</p>
                    <p><strong>Birthday:</strong> ${chicken.birthday || 'Unknown'}</p>
                    ${chicken.latest_note ? `
                        <p class="latest-note">
                            <strong>Latest Note (${new Date(chicken.latest_note_timestamp).toLocaleDateString()}):</strong><br>
                            ${chicken.latest_note}
                        </p>
                    ` : ''}
                </div>
                <div class="chicken-actions">
                    <button class="btn btn-small add-note-btn" data-id="${chicken.id}">Add Note</button>
                    <button class="btn btn-small view-notes-btn" data-id="${chicken.id}">View Notes</button>
                    <button class="btn btn-small btn-delete" data-id="${chicken.id}">Delete</button>
                </div>
            </div>
        `;

        return cardHtml;  // Return the HTML string directly
    }

    bindChickenCardEvents() {
        document.querySelectorAll('.chicken-name-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(e.target.getAttribute('data-id'));
                this.showChickenPage(id);
            });
        });

        document.querySelectorAll('.add-note-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                this.addNote(id);
            });
        });

        document.querySelectorAll('.view-notes-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const chickenName = e.target.closest('.chicken-card').querySelector('.chicken-name-link').textContent;
                this.viewNotes(id, chickenName);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                this.deleteChicken(id);
            });
        });
    }

    async showChickenPage(chickenId) {
        try {
            const chickens = await window.electronAPI.getChickens();
            const chicken = chickens.find(c => c.id === chickenId);
            const notes = await window.electronAPI.getNotes(chickenId);
            const images = await window.electronAPI.getChickenImages(chickenId);

            this.mainContent.innerHTML = `
                <div class="content-header">
                    <h1>${chicken.name}</h1>
                    <button class="btn" onclick="chickenUI.loadDashboard()">Back to Dashboard</button>
                </div>
                
                <div class="chicken-profile">
                    <div class="profile-section">
                        <div class="chicken-details">
                            <h2>Details</h2>
                            <p><strong>Sex:</strong> ${chicken.sex || 'Unknown'}</p>
                            <p><strong>Species:</strong> ${chicken.species || 'Unknown'}</p>
                            <p><strong>Birthday:</strong> ${chicken.birthday || 'Unknown'}</p>
                            <p><strong>Age:</strong> ${chicken.birthday ? this.calculateAge(chicken.birthday) : 'Unknown'}</p>
                        </div>
                    </div>
    
                    <div class="images-section">
                        <div class="images-header">
                            <h2>Photos</h2>
                            <button class="btn" id="addImagesBtn">Add Photos</button>
                        </div>
                        <div class="images-grid">
                            ${images.map((img, index) => `
                                <div class="image-card">
                                    <div class="image-container">
                                        <img src="${img.data}" alt="${chicken.name}" loading="lazy">
                                        <div class="image-overlay">
                                            <button class="btn btn-small btn-img" onclick="chickenUI.openGallery(${index})">View</button>
                                            ${img.isPrimary
                    ? `<button class="btn btn-small" disabled>Primary</button>`
                    : `<button class="btn btn-small" onclick="chickenUI.setPrimaryImage(${img.id}, ${chickenId})">
                                                                                Set as Primary
                                                                               </button>`
                }
                                            <button class="btn btn-small btn-delete" onclick="chickenUI.deleteImage(${img.id}, ${chickenId})">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div class="image-info">
                                        <div class="image-timestamp">
                                            ${new Date(img.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
    
                    <div class="notes-section">
                        <div class="notes-header">
                            <h2>Notes</h2>
                            <button class="btn add-note-btn" data-id="${chicken.id}">Add Note</button>
                        </div>
                        <div class="notes-timeline">
                            ${notes.map(note => `
                                <div class="note-item">
                                    <div class="note-timestamp">${new Date(note.timestamp).toLocaleString()}</div>
                                    <div class="note-text">${note.note}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Store images for gallery view
            this.currentImages = images;
            this.currentChickenId = chickenId;

            // Bind events
            this.bindChickenPageEvents(chickenId);

        } catch (error) {
            console.error('Error loading chicken page:', error);
            alert('Failed to load chicken page');
        }
    }

    calculateAge(birthday) {
        const birthDate = new Date(birthday);
        const today = new Date();
        const diffTime = Math.abs(today - birthDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${Math.floor(diffDays / 30)} months, ${diffDays % 30} days`;
    }

    async addNote(chickenId) {
        this.createNoteModal(chickenId);
    }

    createNoteModal(chickenId) {
        const modal = document.createElement('div');
        modal.className = 'modal active';

        modal.innerHTML = `
            <div class="modal-content">
                <h2>Add Note</h2>
                <form id="noteForm" class="note-form">
                    <div class="form-group">
                        <label for="noteText">Note:</label>
                        <textarea id="noteText" rows="4" required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn">Save Note</button>
                        <button type="button" class="btn btn-delete" id="cancelNoteBtn">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const noteForm = modal.querySelector('#noteForm');
        const cancelBtn = modal.querySelector('#cancelNoteBtn');

        cancelBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        noteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const noteText = document.getElementById('noteText').value;

            try {
                await window.electronAPI.addNote(chickenId, noteText);
                modal.remove();
                this.loadDashboard();
            } catch (error) {
                console.error('Error adding note:', error);
                alert('Failed to add note');
            }
        });
    }

    async deleteChicken(id) {
        if (confirm('Are you sure you want to delete this chicken?')) {
            try {
                await window.electronAPI.deleteChicken(id);
                await window.electronAPI.resetWindowFocus();
                this.loadDashboard();
            } catch (error) {
                console.error('Error deleting chicken:', error);
                alert('Failed to delete chicken');
            }
        }
    }

    async viewNotes(chickenId) {
        try {
            const notes = await window.electronAPI.getNotes(chickenId);
            const chickens = await window.electronAPI.getChickens();
            const chicken = chickens.find(c => c.id === chickenId);

            const modal = document.createElement('div');
            modal.className = 'modal active';

            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Notes for ${chicken.name}</h2>
                    <div class="notes-list">
                        ${notes.map(note => `
                            <div class="note-item">
                                <div class="note-timestamp">${new Date(note.timestamp).toLocaleString()}</div>
                                <div class="note-text">${note.note}</div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn">Close</button>
                </div>
            `;

            document.body.appendChild(modal);

            const closeBtn = modal.querySelector('.btn');
            closeBtn.onclick = () => modal.remove();

            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };
        } catch (error) {
            console.error('Error loading notes:', error);
            alert('Failed to load notes');
        }
    }

    bindChickenPageEvents(chickenId) {
        const addImagesBtn = document.getElementById('addImagesBtn');
        if (addImagesBtn) {
            addImagesBtn.addEventListener('click', () => this.addImages(chickenId));
        }
    }

    addImages(chickenId) {
        window.electronAPI.openFileDialog().then(async (result) => {
            if (!result.canceled && result.filePaths.length > 0) {
                try {
                    for (const filePath of result.filePaths) {
                        console.log('Selected file:', filePath);
                        await window.electronAPI.addImage(chickenId, filePath);
                    }
                    this.showChickenPage(chickenId);
                } catch (error) {
                    console.error('Error adding images:', error);
                    alert('Failed to add images: ' + error.message);
                }
            }
        }).catch(error => {
            console.error('Error opening file dialog:', error);
            alert('Failed to open file dialog');
        });
    }

    async setPrimaryImage(imageId, chickenId) {
        try {
            await window.electronAPI.setPrimaryImage(imageId, chickenId);
            this.showChickenPage(chickenId);
        } catch (error) {
            console.error('Error setting primary image:', error);
            alert('Failed to set primary image');
        }
    }

    async deleteImage(imageId, chickenId) {
        if (confirm('Are you sure you want to delete this image?')) {
            try {
                await window.electronAPI.deleteImage(imageId);
                this.showChickenPage(chickenId);
            } catch (error) {
                console.error('Error deleting image:', error);
                alert('Failed to delete image');
            }
        }
    }

    openGallery(startIndex) {
        const modal = document.createElement('div');
        modal.className = 'gallery-modal';

        let currentIndex = startIndex;

        const updateImage = () => {
            const image = this.currentImages[currentIndex];
            modal.innerHTML = `
                <div class="gallery-content">
                    <img src="${image.data}" alt="" class="gallery-image">
                    <div class="gallery-nav gallery-prev">&lt;</div>
                    <div class="gallery-nav gallery-next">&gt;</div>
                    <div class="gallery-close">×</div>
                </div>
            `;

            // Bind navigation events
            modal.querySelector('.gallery-prev').onclick = () => {
                currentIndex = (currentIndex - 1 + this.currentImages.length) % this.currentImages.length;
                updateImage();
            };

            modal.querySelector('.gallery-next').onclick = () => {
                currentIndex = (currentIndex + 1) % this.currentImages.length;
                updateImage();
            };

            modal.querySelector('.gallery-close').onclick = () => modal.remove();
        };

        document.body.appendChild(modal);
        updateImage();

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}


let chickenUI;
document.addEventListener('DOMContentLoaded', () => {
    chickenUI = new ChickenUI();
    window.chickenUI = chickenUI;
});