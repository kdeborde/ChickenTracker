const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');

class ChickenDB {
    constructor() {
        this.db = new sqlite3.Database('chickens.db');
        this.init();
    }

    init() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS chickens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                species TEXT,
                sex TEXT CHECK(sex IN ('hen', 'rooster')),
                birthday DATE
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS chicken_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chicken_id INTEGER,
                note TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(chicken_id) REFERENCES chickens(id)
            )`);
            this.db.run(`CREATE TABLE IF NOT EXISTS chicken_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chicken_id INTEGER,
                image_data BLOB NOT NULL,
                caption TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_primary BOOLEAN DEFAULT 0,
                FOREIGN KEY(chicken_id) REFERENCES chickens(id)
            )`);
        });
    }

    addChicken(chicken) {
        return new Promise((resolve, reject) => {
            const db = this.db; // Store reference to this.db

            this.db.run(
                `INSERT INTO chickens (name, species, sex, birthday) 
                 VALUES (?, ?, ?, ?)`,
                [chicken.name, chicken.species, chicken.sex, chicken.birthday],
                async function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const chickenId = this.lastID;

                    try {
                        // Add image if there's one
                        if (chicken.photoPath) {
                            const buffer = await fs.readFile(chicken.photoPath);
                            await new Promise((resolve, reject) => {
                                db.run(
                                    `INSERT INTO chicken_images (chicken_id, image_data, is_primary) 
                                     VALUES (?, ?, 1)`,
                                    [chickenId, buffer],
                                    (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                            });
                        }

                        if (chicken.notes) {
                            await new Promise((resolve, reject) => {
                                db.run(
                                    'INSERT INTO chicken_notes (chicken_id, note) VALUES (?, ?)',
                                    [chickenId, chicken.notes],
                                    (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                            });
                        }

                        resolve(chickenId);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    }


    async addImage(chickenId, imagePath, caption = '', isPrimary = false) {
        console.log('Database addImage called with:', { chickenId, imagePath });

        if (!imagePath) {
            throw new Error('Image path is required');
        }
        if (!chickenId) {
            throw new Error('Chicken ID is required');
        }

        try {
            const normalizedPath = path.normalize(imagePath);
            console.log('Reading file from:', normalizedPath);

            const buffer = await fs.readFile(normalizedPath);
            console.log('File read successfully, size:', buffer.length);

            return new Promise((resolve, reject) => {
                // Check if first image for chicken
                this.db.get(
                    'SELECT COUNT(*) as count FROM chicken_images WHERE chicken_id = ?',
                    [chickenId],
                    (err, row) => {
                        if (err) {
                            console.error('Error checking image count:', err);
                            reject(err);
                            return;
                        }

                        // If this is the first image, make it primary
                        const shouldBePrimary = isPrimary || row.count === 0;

                        this.db.run(
                            `INSERT INTO chicken_images (chicken_id, image_data, caption, is_primary) 
                         VALUES (?, ?, ?, ?)`,
                            [chickenId, buffer, caption, shouldBePrimary ? 1 : 0],
                            function (err) {
                                if (err) {
                                    console.error('Error inserting image:', err);
                                    reject(err);
                                    return;
                                }
                                console.log('Image inserted successfully, ID:', this.lastID);
                                resolve(this.lastID);
                            }
                        );
                    }
                );
            });
        } catch (error) {
            console.error('Error in addImage:', error);
            throw error;
        }
    }

    getChickenImages(chickenId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT id, image_data, caption, timestamp, is_primary 
                 FROM chicken_images 
                 WHERE chicken_id = ?
                 ORDER BY timestamp DESC`,
                [chickenId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        // Convert BLOB to base64
                        const images = rows.map(row => ({
                            id: row.id,
                            data: `data:image/jpeg;base64,${row.image_data.toString('base64')}`,
                            caption: row.caption,
                            timestamp: row.timestamp,
                            isPrimary: row.is_primary === 1
                        }));
                        resolve(images);
                    }
                }
            );
        });
    }

    getPrimaryImage(chickenId) {
        return new Promise((resolve, reject) => {
            this.db.get(
                `SELECT image_data 
                 FROM chicken_images 
                 WHERE chicken_id = ? AND is_primary = 1`,
                [chickenId],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (!row) {
                        resolve(null);
                    } else {
                        resolve(`data:image/jpeg;base64,${row.image_data.toString('base64')}`);
                    }
                }
            );
        });
    }

    setPrimaryImage(imageId, chickenId) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // First, unset any existing primary image for this chicken
                this.db.run(
                    'UPDATE chicken_images SET is_primary = 0 WHERE chicken_id = ?',
                    [chickenId],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        // Then set the new primary image
                        this.db.run(
                            'UPDATE chicken_images SET is_primary = 1 WHERE id = ?',
                            [imageId],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    }
                );
            });
        });
    }

    deleteImage(imageId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'DELETE FROM chicken_images WHERE id = ?',
                [imageId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    addNote(chickenId, noteText) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO chicken_notes (chicken_id, note) VALUES (?, ?)',
                [chickenId, noteText],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    getNotes(chickenId) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM chicken_notes WHERE chicken_id = ? ORDER BY timestamp DESC`,
                [chickenId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getChickens() {
        try {
            const chickens = await new Promise((resolve, reject) => {
                this.db.all(
                    `SELECT chickens.*, 
                    (SELECT note FROM chicken_notes 
                     WHERE chicken_id = chickens.id 
                     ORDER BY timestamp DESC LIMIT 1) as latest_note,
                    (SELECT timestamp FROM chicken_notes 
                     WHERE chicken_id = chickens.id 
                     ORDER BY timestamp DESC LIMIT 1) as latest_note_timestamp
                    FROM chickens`,
                    async (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            for (let chicken of chickens) {
                chicken.photoData = await this.getPrimaryImage(chicken.id);
            }

            return chickens;

        } catch (error) {
            throw error;
        }
    }

    deleteChicken(id) {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('DELETE FROM chicken_notes WHERE chicken_id = ?', [id]);
                this.db.run('DELETE FROM chicken_images WHERE chicken_id = ?', [id]);
                this.db.run('DELETE FROM chickens WHERE id = ?', [id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }
}

module.exports = ChickenDB;