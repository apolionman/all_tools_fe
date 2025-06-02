import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { FileText, X } from 'lucide-react';
const Extraction = () => {
    const [files, setFiles] = useState([]);
    const [jsonPrompt, setJsonPrompt] = useState('');
    const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;
    const [isDragging, setIsDragging] = useState(false);
    const [summaries, setSummaries] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // <- Add loading state
    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles([...e.target.files]);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        setFiles([...e.dataTransfer.files]);
    };
    const handleRemoveFile = (indexToRemove) => {
        setFiles(files.filter((_, i) => i !== indexToRemove));
    };
    const handleSubmit = async () => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('prompt', jsonPrompt);
        setLoading(true); // <- Show loader
        try {
            const res = await axios.post(`${backend_url}/api/v1/extract-pdf`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSummaries(res.data.summaries);
            setError(null);
        }
        catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || 'Upload failed.');
            }
            else {
                setError('Unexpected error');
            }
        }
        finally {
            setLoading(false); // <- Hide loader
        }
    };
    const downloadCSV = () => {
        if (summaries.length === 0)
            return;
        const keys = Object.keys(summaries[0].summary);
        const csvData = summaries.map((item) => ({
            Filename: item.filename,
            ...item.summary,
        }));
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'extracted_summaries.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "PDF Extraction Tool" }), _jsxs("div", { onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave, className: `relative border-2 p-6 mb-4 text-center transition-all duration-300 ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-dashed border-gray-400 bg-white'}`, children: [_jsxs("label", { className: "block w-full h-full cursor-pointer relative", children: [_jsx("p", { className: "text-gray-600 pointer-events-none", children: isDragging
                                    ? 'Drop files here'
                                    : 'Drag and drop PDF files here or click to browse' }), _jsx("input", { type: "file", multiple: true, accept: ".pdf", onChange: handleFileChange, className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer" })] }), files.length > 0 && (_jsxs("div", { className: "mt-4 text-left", children: [_jsx("h3", { className: "font-semibold text-sm mb-2", children: "Selected Files:" }), _jsx("ul", { className: "mt-4 space-y-2", children: files.map((file, index) => (_jsxs("li", { className: "flex items-center space-x-2 text-gray-700", children: [_jsx(FileText, { className: "text-red-500 w-5 h-5" }), _jsx("span", { children: file.name }), _jsx("button", { onClick: () => handleRemoveFile(index), className: "text-sm text-red-600 hover:text-red-800", type: "button", "aria-label": `Remove ${file.name}`, children: _jsx(X, { className: "text-red-500 w-2 h-2" }) })] }, index))) })] }))] }), _jsx("textarea", { className: "w-full border p-2 mb-4", placeholder: "Paste your prompt JSON here...", value: jsonPrompt, onChange: (e) => setJsonPrompt(e.target.value), rows: 10 }), _jsx("button", { onClick: handleSubmit, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", disabled: loading, children: loading ? 'Processing...' : 'Submit' }), loading && (_jsx("div", { className: "mt-4 text-blue-600 font-semibold animate-pulse", children: "Uploading and extracting PDF, please wait..." })), error && _jsx("div", { className: "text-red-500 mt-4", children: error }), summaries.length > 0 && (_jsxs("div", { className: "mt-8 overflow-scroll", children: [_jsx("h2", { className: "text-xl font-semibold mb-2", children: "Extraction Results" }), _jsx("button", { onClick: downloadCSV, className: "bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700", children: "Export as CSV" }), _jsxs("table", { className: "min-w-full border-collapse border border-gray-300", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "border border-gray-300 px-2 py-1", children: "Filename" }), Object.keys(summaries[0].summary).map((key) => (_jsx("th", { className: "border border-gray-300 px-2 py-1", children: key }, key)))] }) }), _jsx("tbody", { children: summaries.map((item, idx) => (_jsxs("tr", { className: "border border-gray-300", children: [_jsx("td", { className: "border border-gray-300 px-2 py-1", children: item.filename }), Object.values(item.summary).map((value, i) => (_jsx("td", { className: "border border-gray-300 px-2 py-1", children: String(value) }, i)))] }, idx))) })] })] }))] }));
};
export default Extraction;
