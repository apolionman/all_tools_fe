import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { FileText, X } from 'lucide-react';

const Extraction = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [jsonPrompt, setJsonPrompt] = useState<string>('');
  const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;
  const [isDragging, setIsDragging] = useState(false);

  const [summaries, setSummaries] = useState<
    { filename: string; summary: Record<string, string> }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // <- Add loading state

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
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">PDF Extraction Tool</h1>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 p-6 mb-4 text-center transition-all duration-300 ${
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

      <textarea
        className="w-full border p-2 mb-4"
        placeholder="Paste your prompt JSON here..."
        value={jsonPrompt}
        onChange={(e) => setJsonPrompt(e.target.value)}
        rows={10}
      />

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Submit'}
      </button>

      {loading && (
        <div className="mt-4 text-blue-600 font-semibold animate-pulse">
          Uploading and extracting PDF, please wait...
        </div>
      )}

      {error && <div className="text-red-500 mt-4">{error}</div>}

      {summaries.length > 0 && (
        <div className="mt-8 overflow-scroll">
          <h2 className="text-xl font-semibold mb-2">Extraction Results</h2>
          <button
                onClick={downloadCSV}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
                Export as CSV
            </button>
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
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