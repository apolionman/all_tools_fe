import React, { useState, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import './extraction.css';
import { FileText, X } from 'lucide-react';

const Extraction = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jsonPrompt, setJsonPrompt] = useState<string>('');
  const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;
  const [isDragging, setIsDragging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [summaries, setSummaries] = useState<
    { filename: string; summary: Record<string, string> }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...e.target.files]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setFiles([...e.dataTransfer.files]);
  };
  
  const handleRemoveFile = (indexToRemove: number) => {
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
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Upload failed.');
      } else {
        setError('Unexpected error');
      }
    } finally {
      setLoading(false); // <- Hide loader
    }
  };

  const downloadCSV = () => {
    if (summaries.length === 0) return;
  
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
  
      if (!response.body) throw new Error('No response body');
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullResponse = '';  // <-- accumulate here
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
  
        let boundary = buffer.lastIndexOf('\n');
        if (boundary === -1) continue;
  
        const completeJsonLines = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 1);
  
        const lines = completeJsonLines.split('\n').filter(Boolean);
  
        for (const line of lines) {
          try {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('{') || !trimmedLine.endsWith('}')) continue;
  
            const json = JSON.parse(trimmedLine);
            if (json.response) {
              fullResponse += json.response;  // accumulate
              setJsonPrompt(fullResponse);    // update textarea with full content so far
            }
  
            if (json.done) {
              setIsTyping(false);
              return;
            }
          } catch (err) {
            console.warn('Skipping invalid JSON line:', line);
            continue;
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted.');
      } else {
        console.error('LLM Error:', error);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };
  

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        
      <h1 className="text-2xl font-bold mb-4">PDF Extraction Tool</h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 p-6 mb-4 rounded-lg text-center transition-all duration-300 ${
            isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-dashed border-gray-400 bg-white'
        }`}
        >
        <label className="block w-full h-full cursor-pointer relative">
            <p className="text-gray-600 pointer-events-none">
                {isDragging
                ? 'Drop files here'
                : 'Drag and drop PDF files here or click to browse'}
            </p>
            <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            </label>


        {files.length > 0 && (
            <div className="mt-4 text-left">
            <h3 className="font-semibold text-sm mb-2">Selected Files:</h3>
            <ul className="mt-4 space-y-2">
            {files.map((file, index) => (
                <li key={index} className="flex items-center space-x-2 text-gray-700">
                <FileText className="text-red-500 w-5 h-5" />
                <span>{file.name}</span>
                <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-sm text-red-600 hover:text-red-800"
                    type="button"
                    aria-label={`Remove ${file.name}`}
                >
                    <X className="text-red-500 w-5 h-5" />
                </button>
                </li>
            ))}
            </ul>
            </div>
        )}
        </div>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <h2 className="text-blue-700 font-semibold text-md mb-1">Tool Description</h2>
            <p className="text-sm text-blue-800">
                This tool extracts data from a PDF file and returns a table based on the keywords and structure based on your JSON prompt.
            </p>
        </div>
        <div className="relative mb-4">
        <textarea
            className="w-full border p-2 mb-2 rounded-lg font-mono text-sm"
            placeholder={`Paste your prompt JSON here...
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
            }`}
            value={jsonPrompt}
            onChange={(e) => setJsonPrompt(e.target.value)}
            rows={10}
        />
      <button
        type="button"
        onClick={generateFromLLM}
        disabled={isTyping}
        className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700"
      >
        {isTyping ? 'Typing...' : 'Ask Ochi'}
      </button>

      {isTyping && (
        <button
          onClick={stopStreaming}
          className="text-sm text-red-600 underline mt-2"
        >
          Stop
        </button>
      )}
    </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Submit'}
      </button>

      <div className="mt-4 mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-gray-800 font-semibold text-md mb-2">Sample Output Table</h2>
        <p className="text-sm text-gray-600 mb-3">
            Below is an example of how the extracted data may look based on your JSON prompt:
        </p>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                    <th className="border px-4 py-2">wearable_biosensor</th>
                    <th className="border px-4 py-2">healthcare_monitoring</th>
                    <th className="border px-4 py-2">biomarkers</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <td className="border px-4 py-2">Dexcom G6</td>
                    <td className="border px-4 py-2">Diabetes Management</td>
                    <td className="border px-4 py-2">Glucose</td>
                    </tr>
                    <tr>
                    <td className="border px-4 py-2">Abbott FreeStyle Libre</td>
                    <td className="border px-4 py-2">Blood Sugar Monitoring</td>
                    <td className="border px-4 py-2">Glucose</td>
                    </tr>
                    <tr>
                    <td className="border px-4 py-2">Eccrine Sweat Sensor</td>
                    <td className="border px-4 py-2">Fitness Tracking</td>
                    <td className="border px-4 py-2">Lactate, Sodium</td>
                    </tr>
                </tbody>
                </table>
            </div>
        </div>

      {loading && (
        <div className="mt-4 text-blue-600 font-semibold animate-pulse flex items-center gap-2">
            Uploading and extracting PDF, please wait <div className="loader"></div>
        </div>      
      )}

      {error && <div className="text-red-500 mt-4">{error}</div>}

      {summaries.length > 0 && (
        <div className="mt-4 mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-scroll">
            <h2 className="text-gray-800 font-semibold text-md mb-2">Extracted Data</h2>
          <button
                onClick={downloadCSV}
                className="bg-green-600 mb-4 text-white px-4 py-1 rounded hover:bg-green-700"
            >
                Export as CSV
            </button>
            <table className="min-w-full text-sm text-left rounded-md border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-2 py-1">Filename</th>
                {Object.keys(summaries[0].summary).map((key) => (
                  <th key={key} className="border border-gray-300 px-2 py-1">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map((item, idx) => (
                <tr key={idx} className="border border-gray-300">
                  <td className="border border-gray-300 px-2 py-1">{item.filename}</td>
                  {Object.values(item.summary).map((value, i) => (
                    <td key={i} className="border border-gray-300 px-2 py-1">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Extraction;