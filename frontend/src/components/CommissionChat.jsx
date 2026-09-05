import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

const CommissionChat = ({ commission, artworkId, artist, onUnreadUpdate, embedded }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const isFirstLoad = useRef(true);

  const isClosed = commission ? ['cancelled', 'declined'].includes(commission?.status) : false;
  const isArtworkChat = !!artworkId;
  const threadId = isArtworkChat ? artworkId : commission?.id;

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const fetchMessages = async (isPolling = false) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = isArtworkChat
        ? `/api/messages/?artwork_id=${artworkId}`
        : `/api/messages/?commission_id=${commission.id}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => {
          // If polling and length is the same, avoid unnecessary re-render
          if (isPolling && prev.length === data.length) {
            return prev;
          }
          return data;
        });

        if (onUnreadUpdate) {
          onUnreadUpdate(0);
        }

        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          setTimeout(() => scrollToBottom(false), 50);
        } else if (!isPolling) {
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    isFirstLoad.current = true;
    fetchMessages(false);

    // Poll for new messages every 6 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [threadId]);

  // Scroll to bottom when message list grows
  useEffect(() => {
    if (!isFirstLoad.current) {
      scrollToBottom(true);
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending || isClosed) return;

    setSending(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload = isArtworkChat
        ? { artwork_id: artworkId, body: trimmed }
        : { commission_id: commission.id, body: trimmed };

      const response = await fetch('/api/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        setTimeout(() => scrollToBottom(true), 50);
      } else {
        const err = await response.json();
        addToast(err.error || 'Failed to send message', 'error');
      }
    } catch (err) {
      addToast('Network error while sending message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const formatMessageTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = formatMessageDate(msg.created_at);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const otherParty = isArtworkChat ? artist : commission?.customer;
  const otherName = otherParty?.first_name && otherParty?.last_name
    ? `${otherParty.first_name} ${otherParty.last_name}`
    : otherParty?.username || 'User';

  const otherAvatar = otherParty?.avatar || otherParty?.profile?.avatar;
  const isOtherArtist = isArtworkChat ? true : user?.id === commission?.customer?.id;

  return (
    <div className={`${embedded ? '' : 'rounded-lg border border-stone-200 bg-white'} overflow-hidden flex flex-col h-full`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
        <div className="flex items-center gap-3">
          <div className="relative">
            {otherAvatar ? (
              <img
                src={otherAvatar}
                alt={otherName}
                className="h-10 w-10 rounded-full object-cover border border-stone-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-sm">
                {otherName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 leading-tight">{otherName}</h3>
            <p className="text-xs text-stone-500">
              {isArtworkChat ? 'Inquiry Thread' : (isOtherArtist ? 'Artist' : 'Customer') + ' • Commission Thread'}
            </p>
          </div>
        </div>

        <div className="text-xs text-stone-400 hidden sm:block">
          Auto-updates live
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-stone-50/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 gap-2">
            <svg className="animate-spin h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-xs font-medium">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-stone-800">No messages yet</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              {isArtworkChat
                ? 'Send a message to the artist about this artwork.'
                : 'Send a message to discuss your commission requirements, artistic vision, or timeline.'}
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMsgs]) => (
            <div key={date} className="space-y-3">
              {/* Date Separator */}
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-medium bg-stone-200/70 text-stone-600">
                  {date}
                </span>
              </div>

              {/* Messages in this date */}
              {dateMsgs.map((msg) => {
                const isMine = msg.is_mine || msg.sender?.id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <div className="flex-shrink-0 mb-1">
                        {otherAvatar ? (
                          <img
                            src={otherAvatar}
                            alt={otherName}
                            className="h-7 w-7 rounded-full object-cover border border-stone-200"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-xs">
                            {otherName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`group relative max-w-[82%] sm:max-w-[72%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-stone-900 text-white rounded-br-xs shadow-sm'
                          : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-medium ${
                          isMine ? 'text-stone-400' : 'text-stone-400'
                        }`}
                      >
                        <span>{formatMessageTime(msg.created_at)}</span>
                        {isMine && (
                          <span title={msg.read_at ? 'Read' : 'Sent'}>
                            {msg.read_at ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-stone-100 bg-white">
        {isClosed ? (
          <div className="text-center py-2 px-4 rounded-xl bg-stone-100 text-xs text-stone-500 font-medium">
            This commission is closed. Messages can no longer be sent.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send)"
              rows={1}
              maxLength={4000}
              className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition max-h-32"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 active:bg-stone-950 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 h-[42px]"
            >
              {sending ? (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline">Send</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommissionChat;
