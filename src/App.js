import { jsx as _jsx } from "react/jsx-runtime";
import ChatWindow from './components/ChatWindow';
function App() {
    return (_jsx("div", { className: "h-screen bg-white dark:bg-gray-900", children: _jsx(ChatWindow, {}) }));
}
export default App;
