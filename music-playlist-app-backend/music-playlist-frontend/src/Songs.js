import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function Songs() {
    const [songs, setSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    // State to keep track of the currently playing song
    const [audio, setAudio] = useState(null);
    // State to keep track of the audio element

    useEffect(() => {
        axios.get('http://localhost:5000/api/songs')
            .then(response => {
                setSongs(response.data);
            })
            .catch(error => {
                console.error('Error fetching songs:', error);
            });
    }, []);

    const playSong = (song) => {
        if (currentSong === null || currentSong._id !== song._id) {
            if (audio) {
                audio.pause(); // Pause the current song if any
            }
            const newAudio =
                new Audio(`
                    http://localhost:5000/api/songs/${song._id}/audio`);
            setCurrentSong(song);
            setAudio(newAudio);
            newAudio.play(); // Play the new song
        } else {
            if (audio.paused) {
                audio.play(); // If paused, resume playing
            } else {
                audio.pause(); // If playing, pause
            }
        }
    };

    return (
        <div className="song-container">
            <h2 className="song-title">Songs</h2>
            <ul>
                {
                    songs.map(song => (
                        <li key={song._id} className="song-item" 
                            onClick={() => playSong(song)}>
                            <span>{song.title} - {song.artist}</span>
                            {currentSong && currentSong._id === song._id && (
                                <span className="now-playing">
                                    Now playing: {currentSong.title}
                                </span>
                            )}
                        </li>
                    ))
                }
            </ul>
            {currentSong && (
                <div>
                    <button onClick={() => playSong(currentSong)}>
                        {audio && !audio.paused ? 'Pause' : 'Play'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default Songs;
