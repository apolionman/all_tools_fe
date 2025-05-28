import { jsx as _jsx } from "react/jsx-runtime";
const Message = ({ message }) => {
    const isUser = message.role === 'user';
    return (_jsx("div", { className: `p-2 my-1 ${isUser ? 'text-right' : 'text-left'}`, children: _jsx("div", { className: `inline-block px-4 py-2 rounded-xl ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-200'}`, children: message.content }) }));
};
export default Message;
