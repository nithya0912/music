import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import CSS file

function PlaylistList() {
    const [playlists, setPlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistSongs, setNewPlaylistSongs] = useState([]);
    const [hoveredPlaylist, setHoveredPlaylist] = useState(null);
    // State to track the hovered playlist ID

    useEffect(() => {
        axios.get('http://localhost:5000/api/playlists')
            .then(response => {
                setPlaylists(response.data);
            })
            .catch(error => {
                console.error('Error fetching playlists:', error);
            });
    }, []);

    const handleCreatePlaylist = () => {
        axios.post('http://localhost:5000/api/playlists', {
            name: newPlaylistName,
            songs: newPlaylistSongs,
            // Include songs array in the request body
            user: 'user_id',
            // Replace 'user_id' with the actual user ID
            playlistCode: 'your_playlist_code'
            // Replace 'your_playlist_code' with 
            // the actual playlist code
        })
            .then(response => {
                setPlaylists([...playlists, response.data]);
                setNewPlaylistName('');
                setNewPlaylistSongs([]);
            })
            .catch(error => {
                console.error('Error creating playlist:', error);
            });
    };

    // Function to handle playlist hover
    const handleMouseEnter = (playlistId) => {
        setHoveredPlaylist(playlistId);
    };

    // Function to handle leaving playlist hover
    const handleMouseLeave = () => {
        setHoveredPlaylist(null);
    };

    return (
        <div className="playlist-container">
            <h2 className="playlist-title">Playlists</h2>
            <ul>
                {playlists.map(playlist => (
                    <li
                        key={playlist._id}
                        className="playlist-item"
                        onMouseEnter={() => handleMouseEnter(playlist._id)}
                        // Set the hovered playlist ID
                        onMouseLeave={handleMouseLeave}
                        // Clear the hovered playlist ID when leaving
                        style={
                            {
                                fontSize: "large",
                                fontWeight: "bolder",
                                color: "#3a4750"
                            }}>
                        {playlist.name}
                        {/* Display the songs when the playlist is hovered */}
                        {
                            hoveredPlaylist === playlist._id &&
                            playlist.songs && Array.isArray(playlist.songs) && (
                                <div className="song-list-container"
                                    style={
                                        {
                                            backgroundColor: "#e3e3e3",
                                            padding: "2%",
                                            margin: "1%"
                                        }}> {/* Container for the song list */}
                                    <h3 className="song-list-title">
                                        Songs
                                    </h3>
                                    <ul className="song-list">
                                        {
                                            playlist.songs.map(song => (
                                                <li key={song._id}>
                                                    {song.title}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            )
                        }
                    </li>
                ))}
            </ul>
            <input
                type="text"
                placeholder="Enter playlist name"
                value={newPlaylistName}
                onChange={e => setNewPlaylistName(e.target.value)} />
            <input
                type="text"
                placeholder="Enter songs (separated by commas)"
                value={newPlaylistSongs.join(',')}
                onChange={e => setNewPlaylistSongs(e.target.value.split(','))} />
            <button onClick={handleCreatePlaylist}>
                Create Playlist
            </button>
        </div>
    );
}

export default PlaylistList;
