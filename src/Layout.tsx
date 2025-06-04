// src/components/Layout.tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet, useNavigate } from 'react-router-dom';
import ochi from './assets/ochi.png';
import '../src/App.css';

const Layout: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenPaths = ['/tools', '/chat', '/graph_query'];
  const shouldHide = hiddenPaths.includes(location.pathname);

  return (
    <div className="h-screen bg-white dark:bg-gray-900 flex flex-col relative">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 py-3 px-4 md:px-6 flex items-center justify-between z-50">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full overflow-hidden">
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
          onClick={() => setShowSettings(true)}
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

      {/* Page Content */}
        <div className="flex-1 overflow-scroll">
        {!shouldHide && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto p-4">   
          <div 
            className="relative rounded-2xl pt-6 pb-7 px-8 min-w-0 flex-1 bg-white/50 backdrop-blur-sm cursor-default"
            style={{
              boxShadow: '0 0 0 1px #f1f5f9, 0 2px 4px rgba(0, 0, 0, .05), 0 12px 24px rgba(0, 0, 0, .05)'
            }}
            onClick={() => {
              navigate('/chats');
              setShowSettings(false);
            }}
          >
            <div className="text-xl font-bold mb-2 text-branding">Chat</div>
            <div className="text-slate-500 text-[15px]">
              Ochi's official free AI assistant<br />
              Search for Writing Reading and Translation Tools
            </div>
          </div>

          <div 
            className="relative rounded-2xl pt-6 pb-7 px-8 min-w-0 flex-1 bg-white/50 backdrop-blur-sm cursor-default"
            style={{
              boxShadow: '0 0 0 1px #f1f5f9, 0 2px 4px rgba(0, 0, 0, .05), 0 12px 24px rgba(0, 0, 0, .05)'
            }}
            onClick={() => {
              navigate('/tools');
              setShowSettings(false);
            }}
          >
            <div className="text-xl font-bold mb-2 text-branding">PDF Extractor</div>
            <div className="text-slate-500 text-[15px]">
              Dynamically Extract your pdf<br />
              Add your own JSON parser to extract pdf
            </div>
          </div>

          <div 
            className="relative rounded-2xl pt-6 pb-7 px-8 min-w-0 flex-1 bg-white/50 backdrop-blur-sm cursor-default"
            style={{
              boxShadow: '0 0 0 1px #f1f5f9, 0 2px 4px rgba(0, 0, 0, .05), 0 12px 24px rgba(0, 0, 0, .05)'
            }}
            onClick={() => {
              navigate('/graph_query');
              setShowSettings(false);
            }}
          >
            <div className="text-xl font-bold mb-2 text-branding">Ask your KG</div>
            <div className="text-slate-500 text-[15px]">
              Dynamically Choose your KG<br />
              Query and check your own KG
            </div>
          </div>
        </div>
      )}
        <Outlet />
        </div>

      {/* Slide-in Settings Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 z-50 ${
          showSettings ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">List of available tools</p>

          <button
            onClick={() => {
              navigate('/tools');
              setShowSettings(false);
            }}
            className="w-full flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.26a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.662z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12A9 9 0 113 12a9 9 0 0118 0z"
              />
            </svg>
            PDF extractor
          </button>
          <button
            onClick={() => {
              navigate('/chats');
              setShowSettings(false);
            }}
            className="w-full flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.26a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.662z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12A9 9 0 113 12a9 9 0 0118 0z"
              />
            </svg>
            Chat with ochi
          </button>
          <button
            onClick={() => {
              navigate('/graph_query');
              setShowSettings(false);
            }}
            className="w-full flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.26a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.662z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12A9 9 0 113 12a9 9 0 0118 0z"
              />
            </svg>
            Query KG
          </button>
        </div>
      </div>

      {/* Optional backdrop */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Layout;
