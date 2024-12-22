const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { GridFSBucket, ObjectId } = require('mongodb');
const shortid = require('shortid');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/musicdatabase', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// Initialize GridFS
let gfs;

const conn = mongoose.connection;
conn.once('open', () => {
    gfs = new GridFSBucket(conn.db, {
        bucketName: 'uploads' // Specify your bucket name here
    });
});

// Create storage engine using GridFS
const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/musicdatabase',
    file: (req, file) => {
        return {
            filename: file.originalname,
            bucketName: 'uploads' // Bucket name in MongoDB
        };
    }
});

// Set up multer to handle file uploads
const upload = multer({ storage });

// Route to handle file uploads
app.post('/api/upload', upload.single('audioFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('Uploaded file:', req.file);
    res.json({ fileId: req.file.id });
});

// Playlist Model
const PlaylistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    playlistCode: {
        type: String,
        required: true,
        unique: true,
        default: () => shortid.generate()
    }
});

const Playlist = mongoose.model('Playlist', PlaylistSchema);

// Song Model
const Song = mongoose.model('Song', new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    songcode: { type: String, required: true, unique: true },
    album: String,
    duration: { type: Number, required: true },
    fileId: { type: mongoose.Schema
                            .Types.ObjectId, ref: 'uploads.files' }
    // Reference to GridFS file
}));

// Routes
// Playlists
app.get('/api/playlists', async (req, res) => {
    try {
        const playlists = await Playlist.find().populate('songs');
        res.json(playlists);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/songs/:songId/audio', async (req, res) => {
    try {
        const songId = req.params.songId;

        // Ensure the songId is a valid ObjectId
        if (!ObjectId.isValid(songId)) {
            return res.status(404).json({ error: 'Invalid song ID' });
        }

        // Find the song in MongoDB
        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ error: 'Song not found' });
        }

        // Set the appropriate Content-Type header
        res.set('Content-Type', 'audio/wav');
        // Modify the Content-Type as per your file format

        // Stream the audio file from GridFS
        const downloadStream = gfs.openDownloadStream(song.fileId);
        // Assuming fileId is the ID of the audio file in GridFS
        downloadStream.pipe(res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/playlists/:playlistName/songs', async (req, res) => {
    try {
        const playlistName = req.params.playlistName;
        const playlist =
            await Playlist.findOne({ name: playlistName })
                .populate('songs');
        if (!playlist) {
            return res.status(404)
                      .json({ error: 'Playlist not found' });
        }
        res.json(playlist.songs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update the /api/playlists POST endpoint
app.post('/api/playlists', async (req, res) => {
    try {
        const { name, songs } = req.body;

        // Find the ObjectId values of the 
        // songs specified by their titles
        const existingSongs = await Song.find({ title:{$in: songs} });
        const songIds = existingSongs.map(song => song._id);

        // Validate if all songs were found
        if (existingSongs.length !== songs.length) {
            const missingSongs =
                songs.filter(
                    song => !existingSongs.find(
                        existingSong => existingSong.title === song)
                );
            return res.status(400)
                .json(
                    {
                        error: `One or more songs not found: 
                                ${missingSongs.join(', ')}`
                    });
        }

        // Create the playlist with the provided data
        const playlist = new Playlist({ name, songs: songIds });

        // Save the playlist to the database
        await playlist.save();

        // Return the created playlist
        res.json(playlist);
    } catch (err) {
        if (err.code === 11000 && err.keyPattern
            && err.keyPattern.songcode) {
            return res.status(400)
                .json({ error: 'Duplicate songcode found' });
        } else {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
});

// Collaborative Playlists
app.post('/api/playlists/:playlistId/collaborators',async(req,res) => {
    try {
        const { userId } = req.body;
        const playlist = await Playlist.findByIdAndUpdate(
            req.params.playlistId,
            { $addToSet: { collaborators: userId } },
            { new: true }
        );
        res.json(playlist);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/playlists/collaborative/:userId', async (req, res) => {
    try {
        const playlists =
            await Playlist.find({ collaborators: req.params.userId });
        res.json(playlists);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Songs
app.get('/api/songs', async (req, res) => {
    try {
        const { title, artist, album } = req.query;
        const filter = {};
        if (title) filter.title = new RegExp(title, 'i');
        if (artist) filter.artist = new RegExp(artist, 'i');
        if (album) filter.album = new RegExp(album, 'i');

        const songs = await Song.find(filter);
        res.json(songs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/songs', async (req, res) => {
    try {
        const { title, artist, album, duration } = req.body;
        const song =
            new Song({ title, artist, album, duration });
        await song.save();
        res.json(song);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
