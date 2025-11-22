import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageOverride = null) => {
    const messageToSend = messageOverride || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = {
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    };

    resetActivity();
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add natural typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await base44.functions.invoke('chatbot', {
        message: messageToSend,
        conversationHistory: conversationHistory
      });

      // If response has recommendations, show searching message first
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        const searchingMessage = {
          role: "assistant",
          content: "Perfect! Thanks for the details — give me a moment while I look for the best savings for you.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, searchingMessage]);

        // Wait 2.5 seconds before showing results
        await new Promise(resolve => setTimeout(resolve, 2500));

        const resultsMessage = {
          role: "assistant",
          content: response.data.response,
          recommendations: response.data.recommendations,
          billAnalysis: response.data.billAnalysis,
          showBillUploadButtons: response.data.showBillUploadButtons,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, resultsMessage]);
      } else {
        const assistantMessage = {
          role: "assistant",
          content: response.data.response,
          recommendations: response.data.recommendations,
          billAnalysis: response.data.billAnalysis,
          showBillUploadButtons: response.data.showBillUploadButtons,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.message || 'Unknown error';
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Oops! Something went wrong on my end. Could you try sending that again? If this keeps happening, our support team can help! 😊",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    setInput(reply);
  };

  const handleCategorySelect = async (category) => {
    resetActivity();
    // Add user's category selection
    setMessages(prev => [...prev, {
      role: "user",
      content: category,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    // Add natural typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    try {
      const response = await base44.functions.invoke('chatbot', {
        message: category,
        conversationHistory: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      // If response has recommendations, show searching message first
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        const searchingMessage = {
          role: "assistant",
          content: "Perfect! Thanks for the details — give me a moment while I look for the best savings for you.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, searchingMessage]);

        await new Promise(resolve => setTimeout(resolve, 2500));

        const resultsMessage = {
          role: "assistant",
          content: response.data.response,
          recommendations: response.data.recommendations,
          billAnalysis: response.data.billAnalysis,
          showBillUploadButtons: response.data.showBillUploadButtons,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, resultsMessage]);
      } else {
        const assistantMessage = {
          role: "assistant",
          content: response.data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    resetActivity();

    // Validate file type
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Please upload a PDF, PNG, or JPG file of your electricity bill.",
        timestamp: new Date()
      }]);
      return;
    }

    // Validate file size (10MB max)
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
      // Upload file
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      // Analyze bill with chatbot
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await base44.functions.invoke('chatbot', {
        message: `I've uploaded my electricity bill. Please analyze it.`,
        conversationHistory: conversationHistory,
        billFileUrl: fileUrl
      });

      // If response has recommendations, show searching message first
      if (response.data.recommendations && response.data.recommendations.length > 0) {
        const searchingMessage = {
          role: "assistant",
          content: "Perfect! Thanks for the details — give me a moment while I look for the best savings for you.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, searchingMessage]);

        await new Promise(resolve => setTimeout(resolve, 2500));

        const resultsMessage = {
          role: "assistant",
          content: response.data.response,
          recommendations: response.data.recommendations,
          billAnalysis: response.data.billAnalysis,
          showBillUploadButtons: response.data.showBillUploadButtons,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, resultsMessage]);
      } else {
        const assistantMessage = {
          role: "assistant",
          content: response.data.response,
          recommendations: response.data.recommendations,
          billAnalysis: response.data.billAnalysis,
          showBillUploadButtons: response.data.showBillUploadButtons,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
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
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={i} className="mb-1">
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
          </p>
        );
      }
      // Bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return <p key={i} className="ml-4 mb-1">{line}</p>;
      }
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 px-4 py-3 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all z-[999] flex items-center gap-2 group hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold whitespace-nowrap">Chat with us</span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B35] rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/b405070be_ChatGPTImageNov22202501_00_14AM.png"
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
                    className="bg-white border-2 border-blue-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    Compare or find rates
                  </button>
                  <button
                    onClick={() => handleCategorySelect("Commercial")}
                    className="bg-white border-2 border-blue-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    Business rate
                  </button>
                  <button
                    onClick={() => handleCategorySelect("Renewable")}
                    className="bg-white border-2 border-blue-200 text-gray-800 px-3 py-1.5 rounded-lg font-medium text-sm hover:border-blue-400 hover:bg-blue-50 transition-all"
                  >
                    Renewable energy
                  </button>
                </div>
              )}

              {msg.showBillUploadButtons && (
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:shadow-md transition-all"
                  >
                    📄 Upload Bill
                  </button>
                  <button
                    onClick={() => {
                      setMessages(prev => [...prev, 
                        { role: "user", content: "Skip for now", timestamp: new Date() }
                      ]);
                      handleSend("Skip for now");
                    }}
                    className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
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
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
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