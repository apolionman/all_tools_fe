import React from 'react';
import ChatWindow from './components/ChatWindow';
import ochi from './assets/ochi.png';
import './App.css';

function App() {
  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 py-3 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src={ochi}
              alt="Ochi Avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white ml-2">
            Ochi your VA
          </h1>
        </div>
        <button
          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Settings"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-500 dark:text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-scroll">
        <ChatWindow />
      </div>
    </div>
  );
}

export default App;
