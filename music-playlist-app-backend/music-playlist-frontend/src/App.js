// App.js
import React from 'react';
import PlaylistList from './Playlist';
import SongList from './Songs';
import './App.css';

function App() {
    return (
        <div className="container">
            <h1>Music Playlist App</h1>
            <PlaylistList />
            <SongList />
        </div>
    );
}

export default App;
