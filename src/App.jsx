import React from 'react';
// import ChatWindow from './components/ChatWindow';
function App() {
  const ChatWindow = React.lazy(() => import('./components/ChatWindow'));

    return (<div className="h-screen bg-white dark:bg-gray-900">
      <ChatWindow />
    </div>);
}
export default App;
