import React, { useState, useEffect, useRef } from 'react';
import { MessageType } from '@/chatTypes';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import ochi from '../assets/ochi.png';
import { FaStop } from "react-icons/fa";
import '../index.css';

const KGQueryWindow: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedKG, setSelectedKG] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;

  const kgOptions = [
    { value: '', label: 'Select a Knowledge Graph' },
    { value: 'prime_kg', label: 'Prime KG' },
    { value: 'supplement_kg', label: 'Supplement KG' },
    { value: 'wear_kg', label: 'Wearable KG' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKGChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKG(e.target.value);
  };

 // NEW SCRIPT STARTS HERE
 const sendQuery = async () => {
    if (!input.trim() || isTyping || !selectedKG) return;
  
    const userMsg: MessageType = {
      id: uuidv4(),
      role: 'user',
      content: `[${selectedKG}] ${input}`,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  
    const aiMsgId = uuidv4();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString()
      },
    ]);
  
    try {
      setIsTyping(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;
  
      // First fetch the query response from the knowledge graph
      const queryResponse = await fetch(`${backend_url}/api/v1/query-graph?kg_conn=${selectedKG}&query=${input}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
  
      if (!queryResponse.ok) {
        throw new Error(`Query failed with status ${queryResponse.status}`);
      }
  
      const queryData = await queryResponse.json();
  
      // Then generate a human-readable response using the API
      const response = await fetch(`${backend_url}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemma3:27b',
          prompt: `Transform this knowledge graph response into a clear, concise explanation for the user. Keep it brief but explanatory. Use markdown formatting for lists, bold text, etc. when helpful. The response should be easy to understand:\n\n${JSON.stringify(queryData)}`,
          stream: true,
        }),
        signal: controller.signal,
      });
  
      if (!response.ok) {
        throw new Error(`Generation failed with status ${response.status}`);
      }
  
      if (!response.body) {
        throw new Error("Response body is null");
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
  
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
            if (!trimmedLine.startsWith('{') || !trimmedLine.endsWith('}')) {
              continue;
            }
            const json = JSON.parse(trimmedLine);
  
            if (json.response) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMsgId
                    ? { ...msg, content: msg.content + json.response }
                    : msg
                )
              );
            }
  
            if (json.done) {
              setIsTyping(false);
              return;
            }
          } catch (err) {
            console.warn('⚠️ Failed to parse JSON chunk:', line, err);
            continue;
          }
        }
      }
      if (isTyping) {
        setIsTyping(false);
      }
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Streaming stopped by user');
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? { 
                      ...msg, 
                      content: msg.content + '\n\n...' 
                    }
                  : msg
              )
            );
          } else {
            console.error('Error streaming response:', error);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMsgId
                  ? { ...msg, content: '⚠️ Error fetching response. Please try again.' }
                  : msg
              )
            );
          }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };
 // ENDS HERE


  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const renderMarkdown = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    if (!inline && match) {
      return (
        <div className="relative rounded-xl overflow-hidden bg-[#1e1e1e] my-4">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag="div"
            customStyle={{
              borderRadius: '0.75rem',
              padding: '1rem',
              backgroundColor: 'transparent',
              margin: 0
            }}
            {...props}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
    return (
      <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded" {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-ochi-gradient p-5 rounded-full w-24 h-24 flex items-center justify-center mb-6 shadow-lg">
              <div className="w-[6rem] h-[6rem] rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={ochi}
                  alt="Ochi Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Knowledge Graph Query</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Select a knowledge graph and ask your question to get insights.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`group rounded-xl w-full text-gray-800 dark:text-gray-100 border-black/10 dark:border-gray-700 ${
                  msg.role === 'user' ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-[#444654]'
                }`}
              >
                <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex mx-auto">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={ochi}
                        alt="Ochi Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold">
                        You
                      </div>
                    </div>
                  )}
                  <div className="relative flex-grow min-w-0 flex flex-col">
                    <div className="font-semibold select-none mb-1">
                      {msg.role === 'user' ? 'Y' : 'Ochi'}
                    </div>
                    <div className="flex-col gap-1 md:gap-3">
                      <div className="flex flex-grow flex-col max-w-full">
                        <Markdown
                          children={msg.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: renderMarkdown,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isTyping && messages.length > 0 && (
          <div className="w-full bg-gray-50 dark:bg-[#444654] border-black/10 dark:border-gray-700">
            <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex mx-auto">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={ochi}
                  alt="Ochi Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex items-center ml-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 pt-2 pb-4 px-4">
        <div className="max-w-3xl mx-auto">
          {/* KG Selection Dropdown */}
          <div className="mb-2">
            <select
              value={selectedKG}
              onChange={handleKGChange}
              className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 text-gray-800 dark:text-white"
              disabled={isTyping}
            >
              {kgOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end rounded-xl bg-gray-100 dark:bg-gray-700/50 border dark:border-gray-700 shadow-sm">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 bg-transparent border-0 focus:ring-0 py-3 px-4 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none max-h-32"
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendQuery();
                }
              }}
              placeholder={`${selectedKG ? `Ask about ${selectedKG}...` : 'Select a knowledge graph first'}`}
              disabled={isTyping || !selectedKG}
            />
            <button
              onClick={isTyping ? stopStreaming : sendQuery}
              disabled={isTyping ? false : !input.trim() || !selectedKG}
              className={`m-2 p-2 rounded-full transition-colors duration-200 flex items-center justify-center ${
                isTyping
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : input.trim() && selectedKG
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:opacity-90'
                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              style={{ width: '2.5rem', height: '2.5rem' }}
            >
              {isTyping ? (
                <FaStop className="w-4 h-4" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            Knowledge graph responses may vary based on the selected graph.
          </p>
        </div>
      </div>
    </div>
  );
};

export default KGQueryWindow;