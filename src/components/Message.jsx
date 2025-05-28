import React from 'react';
const Message = ({ message }) => {
    const isUser = message.role === 'user';
    return (<div className={`p-2 my-1 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className={`inline-block px-4 py-2 rounded-xl ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
        {message.content}
      </div>
    </div>);
};
export default Message;
