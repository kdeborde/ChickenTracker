const sqlite3 = require('sqlite3').verbose();

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
                birthday DATE,
                photo_path TEXT
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS chicken_notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chicken_id INTEGER,
                note TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(chicken_id) REFERENCES chickens(id)
            )`);
        });
    }

    addChicken(chicken) {
        return new Promise((resolve, reject) => {
            const db = this.db; // Store reference to this.db

            this.db.run(
                `INSERT INTO chickens (name, species, sex, birthday, photo_path) 
                 VALUES (?, ?, ?, ?, ?)`,
                [chicken.name, chicken.species, chicken.sex, chicken.birthday, chicken.photoPath],
                function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const chickenId = this.lastID;

                    if (chicken.notes) {
                        db.run(
                            'INSERT INTO chicken_notes (chicken_id, note) VALUES (?, ?)',
                            [chickenId, chicken.notes],
                            (noteErr) => {
                                if (noteErr) {
                                    reject(noteErr);
                                    return;
                                }
                                resolve(chickenId);
                            }
                        );
                    } else {
                        resolve(chickenId);
                    }
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

    getChickens() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT chickens.*, 
                (SELECT note FROM chicken_notes 
                 WHERE chicken_id = chickens.id 
                 ORDER BY timestamp DESC LIMIT 1) as latest_note,
                (SELECT timestamp FROM chicken_notes 
                 WHERE chicken_id = chickens.id 
                 ORDER BY timestamp DESC LIMIT 1) as latest_note_timestamp
                FROM chickens`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    deleteChicken(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM chicken_notes WHERE chicken_id = ?', [id], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                this.db.run('DELETE FROM chickens WHERE id = ?', [id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }
}

module.exports = ChickenDB;