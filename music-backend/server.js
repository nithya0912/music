// server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/musicdiscovery",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
const db = mongoose.connection;
db.on('error',
    console.error.bind(
        console, 'MongoDB connection error:'));
db.once('open',
    () => console.log('Connected to MongoDB'));

// Music model
const musicSchema = new mongoose.Schema({
    title: String,
    artist: String,
    genre: String,
    releaseDate: Date,
    songUrl: String, // Added songUrl field
});

const Music = mongoose.model('Music', musicSchema);

// Routes
app.get('/api/music', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    // Case-insensitive search for title
                    { title: { $regex: search, $options: 'i' } },
                    // Case-insensitive search for artist
                    { artist: { $regex: search, $options: 'i' } },
                    // Case-insensitive search for genre
                    { genre: { $regex: search, $options: 'i' } },
                ],
            };
        }
        const music = await Music.find(query);
        res.json(music);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/music', async (req, res) => {
    try {
        const {
            title, artist, genre,
            releaseDate, songUrl } = req.body;
        const newMusic =
            new Music({
                title, artist, genre,
                releaseDate, songUrl
            });
        await newMusic.save();
        res.status(201).json(newMusic);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Edit music endpoint
app.put('/api/music/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, artist, genre,
            releaseDate, songUrl
        } = req.body;
        const updatedMusic =
            await Music.findByIdAndUpdate(
                id, {
                title, artist, genre,
                releaseDate, songUrl
            }, { new: true });
        res.json(updatedMusic);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete music endpoint
app.delete('/api/music/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Music.findByIdAndDelete(id);
        res.json({ message: 'Music deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT,
    () => console.log(`Server running on port ${PORT}`));
