import React, { useState, useEffect, useRef } from 'react';
import { MessageType } from '@/chatTypes';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import angelia from '../assets/angelia.png'
import '../index.css';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;
  console.log("Backend URL:", import.meta.env.VITE_BACKEND_BASE_URL);
  console.log(backend_url)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: MessageType = {
      id: uuidv4(),
      role: 'user',
      content: input,
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
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
      
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
      
        let boundary = buffer.lastIndexOf('\n');
        if (boundary === -1) continue;
      
        const complete = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 1);
      
        const lines = complete.split('\n').filter(Boolean);
      
        for (const line of lines) {
          try {
            const trimmed = line.trim();
            if (!trimmed.startsWith('{')) continue; // skip non-JSON lines
      
            const json = JSON.parse(trimmed);
      
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
            console.warn('⚠️ Failed to parse chunk:', line);
            continue;
          }
        }
      }      
    } catch (error) {
      console.error('Error streaming from Ollama:', error);
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: '⚠️ Error fetching response. Please try again.' }
            : msg
        )
      );
    }
  };

  const renderMarkdown = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 py-3 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full mr-3">
            <svg width="30" height="30" viewBox="0 0 2723 2663" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2648.11 525.497C2641.14 379.296 2576.69 241.865 2468.94 143.435C2361.19 45.0055 2218.95 -6.36203 2073.52 0.630884C1681.55 19.5104 1705.48 342.026 1313.5 360.906C921.48 379.786 914.672 56.4503 522.686 75.3297C450.683 78.7945 380.055 96.4837 314.861 127.387C249.651 158.292 191.139 201.805 142.658 255.443C94.1927 309.081 56.6909 371.794 32.3161 440.001C7.95718 508.206 -2.81703 580.572 0.626713 652.962C4.07046 725.353 21.6685 796.354 52.4095 861.908C83.1504 927.463 126.418 986.29 179.78 1035.03C233.127 1083.77 295.509 1121.46 363.341 1145.97C431.189 1170.47 503.16 1181.29 575.163 1177.83C967.181 1158.99 943.265 836.47 1335.24 817.591C1480.66 810.593 1622.9 861.96 1730.65 960.39C1838.4 1058.82 1902.85 1196.25 1909.82 1342.46C1928.6 1736.55 1606.99 1743.4 1625.77 2137.52C1629.22 2209.91 1646.81 2280.91 1677.56 2346.46C1708.3 2412.02 1751.58 2470.85 1804.93 2519.59C1858.29 2568.33 1920.66 2606.01 1988.5 2630.52C2056.35 2655.02 2128.32 2665.83 2200.33 2662.37C2272.33 2658.91 2342.96 2641.21 2408.17 2610.31C2473.36 2579.4 2531.87 2535.89 2580.35 2482.24C2628.82 2428.6 2666.32 2365.9 2690.68 2297.68C2715.05 2229.47 2725.83 2157.11 2722.37 2084.72C2703.59 1690.59 2382.84 1714.69 2364.06 1320.56C2345.28 926.475 2666.89 919.623 2648.11 525.497Z" fill="#5398EE"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-white">Prepaire Assistant</h1>
        </div>
        <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-5 rounded-full w-24 h-24 flex items-center justify-center mb-6">
              <div className="text-4xl" style={{"transform": "rotate(-40deg)"}}>
                <svg width="60" height="60" viewBox="0 0 2723 2663" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2648.11 525.497C2641.14 379.296 2576.69 241.865 2468.94 143.435C2361.19 45.0055 2218.95 -6.36203 2073.52 0.630884C1681.55 19.5104 1705.48 342.026 1313.5 360.906C921.48 379.786 914.672 56.4503 522.686 75.3297C450.683 78.7945 380.055 96.4837 314.861 127.387C249.651 158.292 191.139 201.805 142.658 255.443C94.1927 309.081 56.6909 371.794 32.3161 440.001C7.95718 508.206 -2.81703 580.572 0.626713 652.962C4.07046 725.353 21.6685 796.354 52.4095 861.908C83.1504 927.463 126.418 986.29 179.78 1035.03C233.127 1083.77 295.509 1121.46 363.341 1145.97C431.189 1170.47 503.16 1181.29 575.163 1177.83C967.181 1158.99 943.265 836.47 1335.24 817.591C1480.66 810.593 1622.9 861.96 1730.65 960.39C1838.4 1058.82 1902.85 1196.25 1909.82 1342.46C1928.6 1736.55 1606.99 1743.4 1625.77 2137.52C1629.22 2209.91 1646.81 2280.91 1677.56 2346.46C1708.3 2412.02 1751.58 2470.85 1804.93 2519.59C1858.29 2568.33 1920.66 2606.01 1988.5 2630.52C2056.35 2655.02 2128.32 2665.83 2200.33 2662.37C2272.33 2658.91 2342.96 2641.21 2408.17 2610.31C2473.36 2579.4 2531.87 2535.89 2580.35 2482.24C2628.82 2428.6 2666.32 2365.9 2690.68 2297.68C2715.05 2229.47 2725.83 2157.11 2722.37 2084.72C2703.59 1690.59 2382.84 1714.69 2364.06 1320.56C2345.28 926.475 2666.89 919.623 2648.11 525.497Z" fill="#5398EE"/>
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">How can I help today?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Ask anything about coding, science, or general knowledge. I'm here to assist!
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`group rounded-xl  w-full text-gray-800 dark:text-gray-100 border-black/10 dark:border-gray-700 ${
                  msg.role === 'user' ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-[#444654]'
                }`}
              >
                <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex mx-auto">
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                      <span className="text-white text-sm">AI</span>
                    </div>
                  )}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                        src={angelia}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  
                  )}
                  <div className="relative flex-grow min-w-0 flex flex-col">
                    <div className="font-semibold select-none mb-1">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="flex-col gap-1 md:gap-3">
                      <div className="flex flex-grow flex-col max-w-full">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: renderMarkdown,
                            p: ({ children }) => (
                              <p className="prose dark:prose-invert prose-sm max-w-none mb-4 last:mb-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 mb-4">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 mb-4">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1">{children}</li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-4">{children}</blockquote>
                            ),
                          }}
                        >
                          {msg.content || ''}
                        </Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="w-full bg-gray-50 dark:bg-[#444654] border-black/10 dark:border-gray-700">
            <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex mx-auto">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center">
                <span className="text-white text-sm">AI</span>
              </div>
              <div className="flex items-center">
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
                  sendMessage();
                }
              }}
              placeholder="Message AI..."
              disabled={isTyping}
              style={{
                "marginLeft": "1rem",
                "marginBottom": "0.2rem"
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className={`m-2 p-2 rounded-full ${
                isTyping || !input.trim()
                  ? 'text-gray-400'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:opacity-90'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;