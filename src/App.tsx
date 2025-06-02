// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../src/Layout';
import ChatWindow from './components/ChatWindow';
import Tools from './pages/Extraction';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="chats" index element={<ChatWindow />} />
          <Route path="tools" element={<Tools />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
