import React, { useState, useEffect, useRef } from "react";
import { UploadFile } from "@/api/supabaseIntegrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Send, MessageCircle, Loader2, Zap, ExternalLink, Upload, Paperclip } from "lucide-react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi there! I'm Nora 😊\nHow can I help you today?",
      timestamp: new Date(),
      showCategoryButtons: true
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showProactivePrompt, setShowProactivePrompt] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const siteIdleTimeoutRef = useRef(null);
  const hasShownProactiveRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startIdleTimeout = () => {
    clearIdleTimeout();
    idleTimeoutRef.current = setTimeout(() => {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'bot' && !isLoading) {
        const proactiveMessages = [
          "Still here? 😊",
          "Take your time! I'm here when you're ready.",
          "No rush - just checking in!",
          "Still with me? Let me know if you need help!"
        ];
        const randomMessage = proactiveMessages[Math.floor(Math.random() * proactiveMessages.length)];
        setMessages(prev => [...prev, { sender: 'bot', text: randomMessage }]);
      }
    }, 60000);
  };

  const clearIdleTimeout = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    clearIdleTimeout();
  };

  useEffect(() => {
    scrollToBottom();
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.sender === 'bot' && !isLoading) {
      startIdleTimeout();
    }
  }, [messages]);

  useEffect(() => {
    return () => clearIdleTimeout();
  }, []);

  // Site-wide inactivity detection for proactive outreach
  useEffect(() => {
    const startSiteIdleTimer = () => {
      if (siteIdleTimeoutRef.current) {
        clearTimeout(siteIdleTimeoutRef.current);
      }
      
      if (!hasEverOpened && !hasShownProactiveRef.current && !isOpen) {
        siteIdleTimeoutRef.current = setTimeout(() => {
          setShowProactivePrompt(true);
          hasShownProactiveRef.current = true;
        }, 120000);
      }
    };

    const resetSiteIdleTimer = () => {
      if (siteIdleTimeoutRef.current) {
        clearTimeout(siteIdleTimeoutRef.current);
      }
      if (!hasEverOpened && !hasShownProactiveRef.current) {
        startSiteIdleTimer();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetSiteIdleTimer, { passive: true });
    });

    startSiteIdleTimer();

    return () => {
      if (siteIdleTimeoutRef.current) {
        clearTimeout(siteIdleTimeoutRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetSiteIdleTimer);
      });
    };
  }, [hasEverOpened, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Helper to call the chatbot API
  const callChatbot = async (payload) => {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error('Chatbot request failed');
    }
    return response.json();
  };

  // Helper to process chatbot response into messages
  const processChatbotResponse = async (responseData) => {
    if (responseData.recommendations && responseData.recommendations.length > 0) {
      const searchingMessage = {
        role: "assistant",
        content: "Perfect! Thanks for the details — give me a moment while I look for the best savings for you.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, searchingMessage]);

      await new Promise(resolve => setTimeout(resolve, 2500));

      const resultsMessage = {
        role: "assistant",
        content: responseData.response,
        recommendations: responseData.recommendations,
        billAnalysis: responseData.billAnalysis,
        showBillUploadButtons: responseData.showBillUploadButtons,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, resultsMessage]);
    } else {
      const assistantMessage = {
        role: "assistant",
        content: responseData.response,
        showBillUploadButtons: responseData.showBillUploadButtons,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const handleSend = async (messageOverride = null) => {
    const messageToSend = messageOverride || input.trim();
    if (!messageToSend || isLoading || uploadingFile) return;

    const userMessage = {
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    };

    resetActivity();
    
    const shouldClearInput = !messageOverride;
    if (shouldClearInput) {
      setInput("");
    }
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const responseData = await callChatbot({
        message: messageToSend,
        conversationHistory,
      });

      await processChatbotResponse(responseData);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = async (category) => {
    resetActivity();
    
    const userMessage = {
      role: "user",
      content: category,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      const responseData = await callChatbot({
        message: category,
        conversationHistory,
      });

      await processChatbotResponse(responseData);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Hmm, I hit a snag there. Mind trying that again? 😊",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    handleCategoryClick(category);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    resetActivity();

    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Please upload a PDF, PNG, or JPG file of your electricity bill.",
        timestamp: new Date()
      }]);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "File size must be less than 10MB. Please upload a smaller file.",
        timestamp: new Date()
      }]);
      return;
    }

    setUploadingFile(true);
    setMessages(prev => [...prev, {
      role: "user",
      content: `📎 Uploaded bill: ${file.name}`,
      timestamp: new Date()
    }]);

    try {
      const uploadResponse = await UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const responseData = await callChatbot({
        message: `I've uploaded my electricity bill. Please analyze it.`,
        conversationHistory,
        billFileUrl: fileUrl,
      });

      await processChatbotResponse(responseData);
    } catch (error) {
      console.error('Bill upload error:', error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble reading that file. Could you try uploading it again, or just tell me your ZIP code and monthly usage? Either works! 😊",
        timestamp: new Date()
      }]);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatMessage = (content) => {
    if (!content || typeof content !== 'string') return null;
    return content.split('\n').map((line, i) => {
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="mb-1">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <p key={i} className="ml-4 mb-1">{line}</p>;
      }
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
    });
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => {
            setIsOpen(true);
            setHasEverOpened(true);
            setShowProactivePrompt(false);
          }}
          className="fixed bottom-6 right-24 px-4 py-3 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all z-[999] flex items-center gap-2 group hover:scale-105"
          aria-label="Open chat"
        >
          <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold whitespace-nowrap">Chat with us</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B35] rounded-full animate-pulse"></span>
        </button>

        {showProactivePrompt && (
          <div 
            className="fixed bottom-28 right-6 bg-white rounded-xl shadow-2xl border-2 border-[#0A5C8C] p-4 max-w-xs z-[998] animate-slideUp"
            style={{ animation: 'slideUp 0.4s ease-out' }}
          >
            <button
              onClick={() => setShowProactivePrompt(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-start gap-3 pr-4">
              <img 
                src="/images/icon.png"
                alt="Nora"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#0A5C8C] flex-shrink-0"
              />
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1">Still looking for energy savings?</p>
                <p className="text-xs text-gray-600 mb-3">I can help find the best rates for your ZIP code! 💡</p>
                <button
                  onClick={() => {
                    setIsOpen(true);
                    setHasEverOpened(true);
                    setShowProactivePrompt(false);
                  }}
                  className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  Chat with Nora
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/images/icon.png"
            alt="Nora"
            className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
          />
          <div>
            <h3 className="font-bold text-sm">Nora - Energy Advisor</h3>
            <p className="text-xs text-blue-100">Online • Ready to help 😊</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-[#0A5C8C] text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
              }`}
            >
              <div className="text-sm leading-relaxed">
                {formatMessage(msg.content)}
              </div>
              
              {msg.showCategoryButtons && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategorySelect("Residential")}
                    disabled={isLoading || uploadingFile}
                    className="bg-white border-2 border-blue-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Compare or find rates
                  </button>
                  <button
                    onClick={() => handleCategorySelect("Commercial")}
                    disabled={isLoading || uploadingFile}
                    className="bg-white border-2 border-blue-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Business rate
                  </button>
                  <button
                    onClick={() => handleCategorySelect("Renewable")}
                    disabled={isLoading || uploadingFile}
                    className="bg-white border-2 border-blue-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Renewable energy
                  </button>
                </div>
              )}

              {msg.showBillUploadButtons && (
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || uploadingFile}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📄 Upload Bill
                  </button>
                  <button
                    onClick={() => handleSend("Skip for now")}
                    disabled={isLoading || uploadingFile}
                    className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip for Now
                  </button>
                </div>
              )}

              {msg.billAnalysis && (
                <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 mb-2">📊 Bill Analysis</div>
                  <div className="space-y-1 text-[11px] text-blue-800">
                    {msg.billAnalysis.currentProvider && (
                      <div><span className="font-semibold">Provider:</span> {msg.billAnalysis.currentProvider}</div>
                    )}
                    {msg.billAnalysis.currentRate && (
                      <div><span className="font-semibold">Current Rate:</span> {msg.billAnalysis.currentRate}¢/kWh</div>
                    )}
                    {msg.billAnalysis.monthlyUsage && (
                      <div><span className="font-semibold">Usage:</span> {msg.billAnalysis.monthlyUsage} kWh</div>
                    )}
                    {msg.billAnalysis.currentCost && (
                      <div><span className="font-semibold">Current Cost:</span> ${msg.billAnalysis.currentCost}</div>
                    )}
                  </div>
                </div>
              )}
              
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 space-y-3">
                  <div className="text-xs font-bold text-gray-900 mb-2">🔥 Top Matches for Your ZIP</div>
                  {msg.recommendations.slice(0, 4).map((rec, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border-2 border-blue-100 hover:border-blue-300 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-gray-900">{rec.provider} — {rec.plan}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {rec.contractLength} months • {rec.rate}¢/kWh
                            {rec.renewable > 0 && ` • ${rec.renewable}% Green 🌱`}
                          </div>
                        </div>
                        {rec.savings > 0 && (
                          <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">
                            Save ${rec.savings}/mo
                          </div>
                        )}
                      </div>
                      {rec.highlights && rec.highlights.length > 0 && (
                        <div className="text-[10px] text-gray-600 mb-2 space-y-0.5">
                          {rec.highlights.map((highlight, idx) => (
                            <div key={idx}>• {highlight}</div>
                          ))}
                        </div>
                      )}
                      <a
                        href={rec.affiliateUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white text-center py-2 rounded-lg font-medium text-xs hover:shadow-md transition-all"
                      >
                        👉 Check Availability
                      </a>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-[10px] opacity-60 mt-2">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {(isLoading || uploadingFile) && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{uploadingFile ? 'Reading your bill...' : 'Nora is typing...'}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile || isLoading}
            variant="outline"
            className="rounded-full w-10 h-10 p-0 border-gray-300 hover:border-[#0A5C8C] hover:bg-blue-50"
            title="Upload electricity bill"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            disabled={isLoading || uploadingFile}
            className="flex-1 rounded-full border-gray-300 focus:border-[#0A5C8C]"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || uploadingFile}
            className="rounded-full w-10 h-10 p-0 bg-[#0A5C8C] hover:bg-[#084a6f]"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
