import React from 'react';
import ChatWindow from './components/ChatWindow';

function App() {
  return (
    <div className="flex flex-col h-[100vh] bg-gray-50 dark:bg-gray-900">
      <ChatWindow />
    </div>
  );
}

export default App;
