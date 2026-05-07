
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, User, Bot } from 'lucide-react';
import { chatService, ChatMessage } from '../services/chatService';

interface ChatBotProps {
    onDeductCredits?: (cost: number) => boolean;
    onRefundCredits?: (amount: number) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ onDeductCredits, onRefundCredits }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        setMessages(chatService.getHistory());

        const handleBlurryImage = () => {
            setIsOpen(true);
            const warning = "Hatt! This photo is too blurry for a 4K Image. Give me a High-Quality Clear Image.";
            chatService.addSystemMessage(warning);
            setMessages([...chatService.getHistory()]);
            if (isSpeaking) handleSpeak(warning);
        };

        window.addEventListener('zeper-blurry-image', handleBlurryImage);
        
        // Initialize Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                handleSend(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (text: string = inputText) => {
        if (!text.trim()) return;

        // Credit check for AI interaction
        const creditCost = isSpeaking ? 2 : 1;
        if (onDeductCredits && !onDeductCredits(creditCost)) {
            return;
        }

        setInputText('');
        setIsTyping(true);
        
        try {
            const response = await chatService.sendMessage(text);
            setMessages([...chatService.getHistory()]);
            setIsTyping(false);

            if (isSpeaking) {
                await handleSpeak(response);
            }
        } catch (err) {
            if (onRefundCredits) onRefundCredits(creditCost);
            setIsTyping(false);
        }
    };

    const handleSpeak = async (text: string) => {
        const audioBase64 = await chatService.generateVoice(text);
        if (audioBase64) {
            const audioData = `data:audio/mp3;base64,${audioBase64}`;
            const audio = new Audio(audioData);
            audio.onerror = (e) => console.error("Audio error:", e);
            try {
                await audio.play();
            } catch (err) {
                console.warn("Audio autoplay blocked or failed:", err);
            }
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Zeper AI Assistant</h3>
                                    <p className="text-xs text-indigo-100">Always here to help</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bot className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm px-8">
                                        Hi! I'm Zeper. How can I help you with your creative workflow today?
                                    </p>
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border border-gray-200'
                                        }`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                                        </div>
                                        <div className={`p-3 rounded-2xl text-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleListening}
                                    className={`p-2 rounded-full transition-colors ${
                                        isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                    title={isListening ? "Stop listening" : "Voice input"}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => setIsSpeaking(!isSpeaking)}
                                    className={`p-2 rounded-full transition-colors ${
                                        isSpeaking ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                                    }`}
                                    title={isSpeaking ? "Voice output on" : "Voice output off"}
                                >
                                    {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                                </button>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value.slice(0, 500))}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask about marketing or app help..."
                                        maxLength={500}
                                        className="w-full pl-4 pr-10 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!inputText.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-600 disabled:text-gray-400"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                    isOpen ? 'bg-gray-800 text-white' : 'bg-indigo-600 text-white'
                }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </div>
    );
};
