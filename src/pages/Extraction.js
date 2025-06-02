import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './extraction.css';
import { FileText, X } from 'lucide-react';
const Extraction = () => {
    const [files, setFiles] = useState([]);
    const [jsonPrompt, setJsonPrompt] = useState('');
    const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;
    const [isDragging, setIsDragging] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const abortControllerRef = useRef(null);
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
    const generateFromLLM = async () => {
        const input = `
      Correct this ${jsonPrompt} in order for the PDF extractor to read the JSON format, If the JSON formatted properly Do not do anything.
    `;
        try {
            setIsTyping(true);
            const controller = new AbortController();
            abortControllerRef.current = controller;
            const response = await fetch(`${backend_url}/api/v1/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gemma3:27b',
                    prompt: input,
                    stream: true,
                }),
                signal: controller.signal,
            });
            if (!response.body)
                throw new Error('No response body');
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let fullResponse = ''; // <-- accumulate here
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                let boundary = buffer.lastIndexOf('\n');
                if (boundary === -1)
                    continue;
                const completeJsonLines = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 1);
                const lines = completeJsonLines.split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const trimmedLine = line.trim();
                        if (!trimmedLine.startsWith('{') || !trimmedLine.endsWith('}'))
                            continue;
                        const json = JSON.parse(trimmedLine);
                        if (json.response) {
                            fullResponse += json.response; // accumulate
                            setJsonPrompt(fullResponse); // update textarea with full content so far
                        }
                        if (json.done) {
                            setIsTyping(false);
                            return;
                        }
                    }
                    catch (err) {
                        console.warn('Skipping invalid JSON line:', line);
                        continue;
                    }
                }
            }
        }
        catch (error) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted.');
            }
            else {
                console.error('LLM Error:', error);
            }
        }
        finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };
    const stopStreaming = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "PDF Extraction Tool" }), _jsxs("div", { onDrop: handleDrop, onDragOver: handleDragOver, onDragLeave: handleDragLeave, className: `relative border-2 p-6 mb-4 rounded-lg text-center transition-all duration-300 ${isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-dashed border-gray-400 bg-white'}`, children: [_jsxs("label", { className: "block w-full h-full cursor-pointer relative", children: [_jsx("p", { className: "text-gray-600 pointer-events-none", children: isDragging
                                    ? 'Drop files here'
                                    : 'Drag and drop PDF files here or click to browse' }), _jsx("input", { type: "file", multiple: true, accept: ".pdf", onChange: handleFileChange, className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer" })] }), files.length > 0 && (_jsxs("div", { className: "mt-4 text-left", children: [_jsx("h3", { className: "font-semibold text-sm mb-2", children: "Selected Files:" }), _jsx("ul", { className: "mt-4 space-y-2", children: files.map((file, index) => (_jsxs("li", { className: "flex items-center space-x-2 text-gray-700", children: [_jsx(FileText, { className: "text-red-500 w-5 h-5" }), _jsx("span", { children: file.name }), _jsx("button", { onClick: () => handleRemoveFile(index), className: "text-sm text-red-600 hover:text-red-800", type: "button", "aria-label": `Remove ${file.name}`, children: _jsx(X, { className: "text-red-500 w-5 h-5" }) })] }, index))) })] }))] }), _jsxs("div", { className: "mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm", children: [_jsx("h2", { className: "text-blue-700 font-semibold text-md mb-1", children: "Tool Description" }), _jsx("p", { className: "text-sm text-blue-800", children: "This tool extracts data from a PDF file and returns a table based on the keywords and structure based on your JSON prompt." })] }), _jsxs("div", { className: "relative mb-4", children: [_jsx("textarea", { className: "w-full border p-2 mb-2 rounded-lg font-mono text-sm", placeholder: `Paste your prompt JSON here...
            e.g.
            {
                "wearable_biosensor": {
                "type": "string",
                "description": "The name or type of the wearable biosensor device."
                },
                "healthcare_monitoring": {
                "type": "string",
                "description": "The healthcare context or purpose for which the device is used."
                },
                "biomarkers": {
                "type": "array",
                "description": "Biological markers that the device monitors, such as glucose, lactate, etc."
                }
            }`, value: jsonPrompt, onChange: (e) => setJsonPrompt(e.target.value), rows: 10 }), _jsx("button", { type: "button", onClick: generateFromLLM, disabled: isTyping, className: "absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700", children: isTyping ? 'Typing...' : 'Ask Ochi' }), isTyping && (_jsx("button", { onClick: stopStreaming, className: "text-sm text-red-600 underline mt-2", children: "Stop" }))] }), _jsx("button", { onClick: handleSubmit, className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", disabled: loading, children: loading ? 'Processing...' : 'Submit' }), _jsxs("div", { className: "mt-4 mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm", children: [_jsx("h2", { className: "text-gray-800 font-semibold text-md mb-2", children: "Sample Output Table" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "Below is an example of how the extracted data may look based on your JSON prompt:" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-sm text-left border border-gray-300", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "border px-4 py-2", children: "wearable_biosensor" }), _jsx("th", { className: "border px-4 py-2", children: "healthcare_monitoring" }), _jsx("th", { className: "border px-4 py-2", children: "biomarkers" })] }) }), _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { className: "border px-4 py-2", children: "Dexcom G6" }), _jsx("td", { className: "border px-4 py-2", children: "Diabetes Management" }), _jsx("td", { className: "border px-4 py-2", children: "Glucose" })] }), _jsxs("tr", { children: [_jsx("td", { className: "border px-4 py-2", children: "Abbott FreeStyle Libre" }), _jsx("td", { className: "border px-4 py-2", children: "Blood Sugar Monitoring" }), _jsx("td", { className: "border px-4 py-2", children: "Glucose" })] }), _jsxs("tr", { children: [_jsx("td", { className: "border px-4 py-2", children: "Eccrine Sweat Sensor" }), _jsx("td", { className: "border px-4 py-2", children: "Fitness Tracking" }), _jsx("td", { className: "border px-4 py-2", children: "Lactate, Sodium" })] })] })] }) })] }), loading && (_jsxs("div", { className: "mt-4 text-blue-600 font-semibold animate-pulse flex items-center gap-2", children: ["Uploading and extracting PDF, please wait ", _jsx("div", { className: "loader" })] })), error && _jsx("div", { className: "text-red-500 mt-4", children: error }), summaries.length > 0 && (_jsxs("div", { className: "mt-4 mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-scroll", children: [_jsx("h2", { className: "text-gray-800 font-semibold text-md mb-2", children: "Sample Output Table" }), _jsx("button", { onClick: downloadCSV, className: "bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700", children: "Export as CSV" }), _jsxs("table", { className: "min-w-full text-sm text-left border border-gray-300", children: [_jsx("thead", { className: "bg-gray-100", children: _jsxs("tr", { children: [_jsx("th", { className: "border border-gray-300 px-2 py-1", children: "Filename" }), Object.keys(summaries[0].summary).map((key) => (_jsx("th", { className: "border border-gray-300 px-2 py-1", children: key }, key)))] }) }), _jsx("tbody", { children: summaries.map((item, idx) => (_jsxs("tr", { className: "border border-gray-300", children: [_jsx("td", { className: "border border-gray-300 px-2 py-1", children: item.filename }), Object.values(item.summary).map((value, i) => (_jsx("td", { className: "border border-gray-300 px-2 py-1", children: String(value) }, i)))] }, idx))) })] })] }))] }));
};
export default Extraction;
