import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { messageService } from '../services/hmsServices.js';
import { Send, Hash, MessageSquare, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/UI.jsx';

export const Messages = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [channels, setChannels] = useState([
    { id: 'general', name: 'General Announcements', icon: Hash },
    { id: 'doctors', name: 'Doctors Lounge', icon: MessageSquare },
    { id: 'nurses', name: 'Nurses Shift Board', icon: MessageSquare },
    { id: 'pharmacy', name: 'Pharmacy Inventory Logs', icon: Hash }
  ]);
  const [activeChannel, setActiveChannel] = useState('general');
  const [messageLogs, setMessageLogs] = useState([]);
  const [inputText, setInputText] = useState('');

  const loadMessages = async () => {
    try {
      const logs = await messageService.getByChannel(activeChannel);
      setMessageLogs(logs);
    } catch (err) {
      toast.error('Failed to load message thread.');
    }
  };

  useEffect(() => {
    loadMessages();
  }, [activeChannel]);

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const payload = {
        channelId: activeChannel,
        text: inputText,
        senderName: user?.name || 'Staff member',
        senderRole: user?.role || 'Operator'
      };

      await messageService.create(payload, user.id);
      setInputText('');
      loadMessages();
      toast.success('Message posted to board.');
    } catch (err) {
      toast.error('Failed to post message.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Title */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Staff Messaging Board</h1>
          <p className="text-slate-400 text-xs mt-1">Coordinate operations and shifts across administrative channels.</p>
        </div>
      </div>

      {/* Messaging split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column Channels */}
        <div className="flex flex-col gap-3 select-none">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Operational Channels</span>
          {channels.map((chan) => {
            const Icon = chan.icon;
            return (
              <button
                key={chan.id}
                onClick={() => setActiveChannel(chan.id)}
                className={`p-4 border rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] flex items-center justify-between ${
                  activeChannel === chan.id
                    ? 'bg-primary-600 text-white border-primary-600 shadow-premium'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-750 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-sm">{chan.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column Messages thread */}
        <div className="lg:col-span-3 flex flex-col h-[500px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-premium overflow-hidden">
          {/* Channel Header */}
          <div className="p-4 border-b border-slate-50 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-900/10 select-none">
            <h3 className="text-xs font-bold text-slate-805 dark:text-white">
              #{channels.find(c => c.id === activeChannel)?.name}
            </h3>
          </div>

          {/* Messages Lists */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
            {messageLogs.map((msg) => {
              const isMe = msg.senderName === user?.name;
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center flex-shrink-0 font-bold text-xs select-none uppercase">
                    {msg.senderName.charAt(0)}
                  </div>
                  <div className={`p-3.5 rounded-2xl text-xs ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-750 dark:text-slate-350 rounded-tl-none border border-slate-100 dark:border-slate-800'
                  }`}>
                    <div className={`text-[9px] font-extrabold uppercase mb-1 ${isMe ? 'text-primary-200' : 'text-primary-600'}`}>
                      {msg.senderName} • {msg.senderRole}
                    </div>
                    <p className="whitespace-pre-line leading-relaxed font-semibold">{msg.text}</p>
                    <span className={`text-[8.5px] block mt-1.5 text-right ${isMe ? 'text-primary-200' : 'text-slate-450'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })}
            {messageLogs.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl text-slate-405 select-none my-auto">
                <AlertCircle className="w-5 h-5 text-slate-300" />
                <span>No messages posted in this channel thread.</span>
              </div>
            )}
          </div>

          {/* Form write footer */}
          <form 
            onSubmit={handlePostMessage}
            className="p-4 border-t border-slate-50 dark:border-slate-750 flex gap-2 select-none"
          >
            <input
              type="text"
              placeholder={`Write message to #${channels.find(c => c.id === activeChannel)?.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow bg-slate-50 dark:bg-slate-900 border text-xs px-4 py-3 rounded-xl outline-none focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-slate-800 dark:text-slate-100"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputText.trim()}
              icon={Send}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
