import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../src/Layout';
import ChatWindow from './components/ChatWindow';
import Tools from './pages/Extraction';
import GraphQuery from './pages/KGQueryWindow';
const App = () => {
    return (_jsx(Router, { children: _jsx(Routes, { children: _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { path: "chats", index: true, element: _jsx(ChatWindow, {}) }), _jsx(Route, { path: "tools", element: _jsx(Tools, {}) }), _jsx(Route, { path: "graph_query", element: _jsx(GraphQuery, {}) })] }) }) }));
};
export default App;
