// LiveLink/client/src/App.tsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Emissor from './pages/Emissor';
import Receptor from './pages/Receptor';
import './App.css'; 

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Emissor />} /> 
        <Route path="/receptor" element={<Receptor />} />
      </Routes>
    </div>
  );
}

export default App;