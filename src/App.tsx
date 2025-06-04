// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../src/Layout';
import ChatWindow from './components/ChatWindow';
import Tools from './pages/Extraction';
import GraphQuery from './pages/KGQueryWindow';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Layout />}>
          <Route path="chats" index element={<ChatWindow />} />
          <Route path="tools" element={<Tools />} />
          <Route path="graph_query" element={<GraphQuery />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
