//App.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [musicList, setMusicList] = useState([]);
    const [newMusic, setNewMusic] =
        useState({
            title: '', artist: '',
            genre: '', releaseDate: '',
            songUrl: ''
        });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSong, setCurrentSong] = useState(null);
    const [audioPlayer, setAudioPlayer] = useState(null);
    // Track playing state
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:3001/api/music')
            .then(response => setMusicList(response.data))
            .catch(error =>
                console.error('Error fetching music:', error));
    }, []);

    const handleSearch = () => {
        // Trim whitespace from search term
        let searchQuery = searchTerm.trim();

        if (searchQuery === '') {
            // If search query is empty, fetch all songs
            axios.get('http://localhost:3001/api/music')
                .then(response => 
                    setMusicList(response.data))
                .catch(error => 
                    console.error('Error fetching music:', error));
        } else {
            // Otherwise, perform search with non-empty query
            axios.get(
`http://localhost:3001/api/music?search=${searchQuery}`)
                .then(response => setMusicList(response.data))
                .catch(error => 
                    console.error('Error searching music:', error));
        }
    };

    const handleInputChange = e => {
        const { name, value } = e.target;
        setNewMusic(
            prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = e => {
        e.preventDefault();
        if (!newMusic.title ||
            !newMusic.artist ||
            !newMusic.genre ||
            !newMusic.releaseDate ||
            !newMusic.songUrl) {
            console.error('Please fill in all fields.');
            return;
        }

        axios.post('http://localhost:3001/api/music', newMusic)
            .then(response => {
                setMusicList(
                    prevState => [...prevState, response.data]);
                setNewMusic({
                    title: '', artist: '',
                    genre: '', releaseDate: '',
                    songUrl: ''
                });
                console.log('Music added successfully.');
            })
            .catch(error => 
                console.error('Error adding music:', error));
    };

    const handleEdit = (id, currentMusic) => {
        let updatedTitle = 
            prompt("Enter updated title:", currentMusic.title);
        let updatedArtist = 
            prompt("Enter updated artist:", currentMusic.artist);
        let updatedGenre = 
            prompt("Enter updated genre:", currentMusic.genre);
        let updatedReleaseDate =
            prompt("Enter updated release date (YYYY-MM-DD):", 
                    currentMusic.releaseDate);
        let updatedSongUrl = 
            prompt("Enter updated song URL:", 
                    currentMusic.songUrl);

        // Check if any field is null or undefined
        if (updatedTitle === null || updatedTitle === undefined ||
            updatedArtist === null || updatedArtist === undefined ||
            updatedGenre === null || updatedGenre === undefined ||
            updatedReleaseDate === null ||
            updatedReleaseDate === undefined ||
            updatedSongUrl === null || updatedSongUrl === undefined) {
            console.error('Please fill in all fields.');
            return;
        }

        // Construct updatedMusic object
        const updatedMusic = {
            title: updatedTitle,
            artist: updatedArtist,
            genre: updatedGenre,
            releaseDate: updatedReleaseDate,
            songUrl: updatedSongUrl
        };

        axios.put(
`http://localhost:3001/api/music/${id}`, updatedMusic)
            .then(response => {
                const updatedList =
                    musicList.map(music =>
                        (music._id === id ? response.data : music));
                setMusicList(updatedList);
                console.log('Music edited successfully.');
            })
            .catch(error =>
                console.error('Error editing music:', error));
    };


    const handleDelete = id => {
        axios.delete(`http://localhost:3001/api/music/${id}`)
            .then(() => {
                const updatedList =
                    musicList.filter(
                        music => music._id !== id);
                setMusicList(updatedList);
                console.log('Music deleted successfully.');
            })
            .catch(error =>
                console.error('Error deleting music:', error));
    };

    const playSong = (songUrl) => {
        if (audioPlayer) {
            // Check if audio is paused before attempting to play
            if (audioPlayer.paused) {
                audioPlayer.src = songUrl;
                audioPlayer.load();
                audioPlayer.play();
                setIsPlaying(true); // Update playing state
                setCurrentSong(songUrl); // Set current song
            }
        }
    };

    useEffect(() => {
        if (audioPlayer) {
            audioPlayer.onended = () => {
                setCurrentSong(null);
                setIsPlaying(false); // Update playing state
            };
        }
    }, [audioPlayer]);

    return (
        <div className="App">
            <h1>Music Discovery App</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="title" 
                       placeholder="Title" value={newMusic.title} 
                       onChange={handleInputChange} />
                <input type="text" name="artist" 
                       placeholder="Artist" value={newMusic.artist} 
                       onChange={handleInputChange} />
                <input type="text" name="genre" 
                             placeholder="Genre" value={newMusic.genre} 
                             onChange={handleInputChange} />
                <input type="date" name="releaseDate" 
                       value={newMusic.releaseDate} 
                       onChange={handleInputChange} />
                <input type="text" name="songUrl" 
                       placeholder="Song URL" value={newMusic.songUrl} 
                       onChange={handleInputChange} />
                <button type="submit">Add Music</button>
            </form>
            <div className="search-container">
                <input type="text" placeholder="Search music..." 
                       value={searchTerm} onChange={
                       (e) => setSearchTerm(e.target.value)} />
                <button onClick={handleSearch}>Search</button>
            </div>
            <div className="music-list">
                {musicList.map(music => (
                    <div className={
`music-item ${currentSong === music.songUrl ? 'playing' : ''}`} 
                         key={music._id}>
                        <div className="music-info">
                            <h3>{music.title}</h3>
                            <p>Artist: {music.artist}</p>
                            <p>Genre: {music.genre}</p>
                            <p>
Release Date: {new Date(music.releaseDate).toLocaleDateString()}
                            </p>
                            {currentSong === music.songUrl ? (
                                <button onClick={() => {
                                    audioPlayer.pause();
                                    setIsPlaying(false);
                                    setCurrentSong(null);
                                }}>Pause</button>
                            ) : (
                                <button onClick={() => {
                                    playSong(music.songUrl);
                                    setCurrentSong(music.songUrl);
                                }}>
{isPlaying && currentSong === music.songUrl ? 'Pause' : 'Play'}
                                </button>
                            )}
                        </div>
                        <div className="music-actions">
                            <button onClick={
                                () => handleEdit(music._id,
                                    { title: 'Updated Title' })}>
                                Edit
                            </button>
                            <button onClick={
                                () => handleDelete(music._id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <audio ref={(ref) => setAudioPlayer(ref)} />
        </div>
    );
}

export default App;
