import React, { useState, useEffect, useRef } from 'react';
import { MessageType } from '@/chatTypes';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { v4 as uuidv4 } from 'uuid';
import angelia from '../assets/angelia.png'
import ochi from '../assets/ochi.png'
import { FaStop } from "react-icons/fa";
import '../index.css';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const backend_url = import.meta.env.VITE_BACKEND_BASE_URL;

  // Recording states and refs
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Use ref for audio chunks
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    // --- Cleanup phase for any previous recording ---
    if (mediaRecorder) {
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.onstop = null; // Detach old handlers to prevent unexpected firing
        mediaRecorder.ondataavailable = null;
        mediaRecorder.stop();
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setMediaRecorder(null); // Clear the state for the old recorder
    audioChunksRef.current = []; // Reset audio chunks ref for the new recording
    // console.log(audioChunksRef);
    // --- Setup phase for new recording ---
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      setMediaRecorder(recorder); // Set the new recorder instance

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          console.warn('No audio data recorded.');
          setInput('⚠️ No audio data was recorded. Please try again.');
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', blob, 'voice.webm');
        console.log(blob.type);

        try {
          const response = await fetch(`${backend_url}/api/v1/transcribe`, {
            method: 'POST',
            body: formData,
          });
          console.log(response);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Transcription server error: ${response.status} ${response.statusText}. ${errorText}`);
          }

          const data = await response.json();
          const transcribedText = data.transcription || '⚠️ No transcription available.';
          setInput(transcribedText);
        } catch (err: any) {
          console.error('Transcription error:', err);
          setInput(`⚠️ Failed to transcribe audio: ${err.message}`);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Could not start recording:', err);
      setIsRecording(false); // Ensure UI is not stuck if start fails
      setInput(`⚠️ Could not start recording: ${err.message}. Check microphone permissions.`);
      // Clean up any partially initialized resources
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setMediaRecorder(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      // Only call stop if it's in a state where stop is meaningful
      if (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused') {
        mediaRecorder.stop(); // This will trigger recorder.onstop for data processing
      }
    }

    // Clean up the media stream and tracks, if the stream reference exists
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null; // Clear the ref after stopping tracks
    }

    // Always update the recording state to false when stop is initiated by the user
    setIsRecording(false);
    // audioChunksRef.current is cleared at the beginning of startRecording
    // mediaRecorder state is cleared at the beginning of startRecording
  };


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
            // Ensure it's a valid JSON object before parsing
            if (!trimmedLine.startsWith('{') || !trimmedLine.endsWith('}')) {
                 // console.warn('Skipping non-JSON line:', trimmedLine); // Optional: for debugging
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
            // Potentially handle partial JSON or other errors if necessary
            continue;
          }
        }
      }
      // If loop finishes due to `done` but `json.done` was not true in the last chunk.
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
        console.error('Error streaming from Ollama:', error);
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
      abortControllerRef.current = null; // Reset abort controller
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const exportTableToCSV = (table: HTMLTableElement) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    const csv = rows.map(row => {
      const cols = Array.from(row.querySelectorAll('th, td'));
      return cols.map(col => '"' + col.textContent?.replace(/"/g, '""') + '"').join(',');
    }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'table_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMarkdown = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    };

    // Custom rendering for tables with export option
    if (node.tagName === 'table') {
      return (
        <div className="relative overflow-x-auto my-4 border rounded-lg shadow-sm">
          <button
            className="absolute right-2 top-2 text-xs bg-blue-500 text-white px-2 py-1 rounded mb-1"
            onClick={() => exportTableToCSV(node as HTMLTableElement)}
          >
            Export CSV
          </button>
          <table className="table-auto w-full border-collapse text-sm text-left">
            {children}
          </table>
        </div>
      );
    }

    return !inline && match ? (
      <div className="relative rounded-xl overflow-hidden bg-[#1e1e1e] my-4">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-sm text-white bg-black/40 hover:bg-black/70 px-2 py-1 rounded-md transition"
        >
          Copy
        </button>
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
    ) : (
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
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Hi I'm Ochi your Virtual Assistant, how can I help today?</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Ask anything about coding, science, or general knowledge. I'm here to assist!
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
                      {msg.role === 'user' ? 'You' : 'Ochi'}
                    </div>
                    <div className="flex-col gap-1 md:gap-3">
                      <div className="flex flex-grow flex-col max-w-full">
                      <Markdown
                          children={msg.content}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: renderMarkdown,
                            table: renderMarkdown,
                            th: (props) => <th className="border px-2 py-1 bg-gray-200 dark:bg-gray-700" {...props} />,
                            td: (props) => <td className="border px-2 py-1" {...props} />,
                            tr: (props) => <tr className="border-t" {...props} />,
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

        {/* Typing indicator */}
        {isTyping && messages.length > 0 && ( // Added messages.length > 0 to avoid showing typing on empty chat
          <div className="w-full bg-gray-50 dark:bg-[#444654] border-black/10 dark:border-gray-700">
            <div className="text-base gap-4 md:gap-6 md:max-w-2xl lg:max-w-2xl xl:max-w-3xl p-4 md:py-6 flex mx-auto">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                 <img
                    src={ochi}
                    alt="Ochi Avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
               </div>
              <div className="flex items-center ml-4"> {/* Added ml-4 for spacing */}
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
              placeholder="Message Ochi..." // Changed placeholder
              disabled={isTyping}
              style={{
                marginLeft: "1rem", // Keep consistent with original if desired
                // marginBottom: "0.2rem" // This was causing slight misalignment with buttons
              }}
            />
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`m-2 p-2 rounded-full items-center justify-center transition-colors duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
              }`}
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
            >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              {isRecording ? (
                <path d="M12 2C10.8954 2 10 2.89543 10 4V12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2ZM8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12H18C18 15.3137 15.3137 18 12 18V22H12C12 22 12 22 12 22H12V18C8.68629 18 6 15.3137 6 12H8Z"/>
              ) : (
                <path d="M12 14C13.6569 14 15 12.6569 15 11V5C15 3.34315 13.6569 2 12 2C10.3431 2 9 3.34315 9 5V11C9 12.6569 10.3431 14 12 14ZM19 11C19 14.866 15.866 18 12 18C8.13401 18 5 14.866 5 11H7C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11H19Z" />
              )}
            </svg>
            </button>

            <button
              onClick={isTyping ? stopStreaming : sendMessage}
              disabled={isTyping ? false : !input.trim()}
              className={`m-2 p-2 rounded-full transition-colors duration-200 flex items-center justify-center ${
                isTyping
                  ? 'bg-red-500 hover:bg-red-600 text-white' // Red for stop button
                  : input.trim()
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:opacity-90'
                    : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              style={{ width: '2.5rem', height: '2.5rem' }}
            >
              {isTyping ? (
                <FaStop className="w-4 h-4" /> // Stop icon
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
            AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;