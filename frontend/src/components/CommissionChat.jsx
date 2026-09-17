import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import authFetch from '../utils/authFetch';
import useWebSocket from '../hooks/useWebSocket';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/zip', 'application/x-zip-compressed'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const QUICK_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '🎉', '💯'];

const CommissionChat = ({ commission, artworkId, artist, onUnreadUpdate, embedded }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [fileAttachment, setFileAttachment] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMsg, setEditingMsg] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const isFirstLoad = useRef(true);
  const typingTimeoutRef = useRef(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [otherTyping, setOtherTyping] = useState(false);

  const isClosed = commission ? ['cancelled', 'declined'].includes(commission?.status) : false;
  const isArtworkChat = !!artworkId;
  const threadId = isArtworkChat ? artworkId : commission?.id;

  // Other party ID for WebSocket
  const otherPartyId = isArtworkChat
    ? null
    : (user?.id === commission?.customer?.id ? commission?.artist?.id : commission?.customer?.id);

  // WebSocket handlers
  const handleWsMessage = useCallback((msg) => {
    // Only add if it belongs to this thread
    const belongsToThread = isArtworkChat
      ? msg.artwork === artworkId
      : (msg.commission === commission?.id || (otherPartyId && (msg.sender?.id === otherPartyId || msg.receiver?.id === otherPartyId)));

    if (belongsToThread) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Browser notification for incoming messages when tab is hidden
      if (!msg.is_mine && document.visibilityState === 'hidden' && Notification.permission === 'granted') {
        const senderName = msg.sender?.first_name || msg.sender?.username || 'Someone';
        new Notification(`${senderName} sent a message`, {
          body: msg.body?.slice(0, 100) || 'New message',
          icon: msg.sender?.avatar || '/vite.svg',
          tag: 'artisa-message',
        });
      }
    }
  }, [isArtworkChat, artworkId, commission?.id, otherPartyId]);

  const handleWsTyping = useCallback((userId, isTyping) => {
    if (userId !== user?.id) {
      setOtherTyping(isTyping);
    }
  }, [user?.id]);

  const handleWsRead = useCallback((messageIds, readerId) => {
    if (readerId !== user?.id) {
      setMessages((prev) => prev.map((m) =>
        messageIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
      ));
    }
  }, [user?.id]);

  const { send: wsSend, connected } = useWebSocket({
    onMessage: handleWsMessage,
    onTyping: handleWsTyping,
    onRead: handleWsRead,
  });

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const fetchMessages = async (isPolling = false) => {
    try {
      let url;
      if (isArtworkChat) {
        url = `/api/messages/?artwork_id=${artworkId}`;
      } else {
        // Use user_id to get ALL messages between the two parties (commission + inquiry)
        const otherPartyId = user?.id === commission?.customer?.id
          ? commission?.artist?.id
          : commission?.customer?.id;
        url = otherPartyId
          ? `/api/messages/?user_id=${otherPartyId}`
          : `/api/messages/?commission_id=${commission.id}`;
      }
      console.log('[CommissionChat] fetching:', url, 'isPolling:', isPolling);
      const response = await authFetch(url);
      console.log('[CommissionChat] response status:', response.status, 'ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[CommissionChat] received messages:', data.length, data);
        setMessages((prev) => {
          // If polling and length is the same, avoid unnecessary re-render
          if (isPolling && prev.length === data.length) {
            return prev;
          }
          // Browser notification for new incoming messages during polling
          if (isPolling && data.length > prev.length) {
            const newMsgs = data.slice(prev.length);
            const incoming = newMsgs.filter(m => !m.is_mine && m.sender?.id !== user?.id);
            if (incoming.length > 0 && document.visibilityState === 'hidden' && Notification.permission === 'granted') {
              const last = incoming[incoming.length - 1];
              const senderName = last.sender?.first_name || last.sender?.username || 'Someone';
              new Notification(`${senderName} sent a message`, {
                body: last.body?.slice(0, 100) || 'New message',
                icon: last.sender?.avatar || '/vite.svg',
                tag: 'artisa-message',
              });
            }
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
    console.log('[CommissionChat] useEffect fired, threadId:', threadId, 'artworkId:', artworkId, 'commission:', commission?.id);
    isFirstLoad.current = true;
    fetchMessages(false);

    // Request notification permission if not yet granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Fallback poll every 15s when WebSocket is disconnected
    const interval = setInterval(() => {
      if (!connected) fetchMessages(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [threadId, otherPartyId, connected]);

  // Scroll to bottom when message list grows
  useEffect(() => {
    if (!isFirstLoad.current) {
      scrollToBottom(true);
    }
  }, [messages.length]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      addToast('File type not allowed. Send images, PDFs, or ZIP files.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      addToast('File too large (max 25MB).', 'error');
      return;
    }
    setFileAttachment(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview({ type: 'image', url: ev.target.result, name: file.name });
      reader.readAsDataURL(file);
    } else {
      setFilePreview({ type: 'file', name: file.name, size: file.size });
    }
    e.target.value = '';
  };

  const removeFile = () => {
    setFileAttachment(null);
    setFilePreview(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setEmojiPickerMsgId(null);
      }
    };
    if (openMenuId || emojiPickerMsgId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId, emojiPickerMsgId]);

  const handleReply = (msg) => {
    setReplyTo(msg);
    setOpenMenuId(null);
    setEditingMsg(null);
    textareaRef.current?.focus();
  };

  const handleCopy = (msg) => {
    navigator.clipboard.writeText(msg.body).then(() => {
      addToast('Message copied', 'success');
    });
    setOpenMenuId(null);
  };

  const handleEdit = (msg) => {
    setEditingMsg(msg);
    setText(msg.body);
    setOpenMenuId(null);
    setReplyTo(null);
    textareaRef.current?.focus();
  };

  const handleEditSave = async () => {
    if (!editingMsg || !text.trim()) return;
    setSending(true);
    try {
      const response = await authFetch('/api/messages/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingMsg.id, body: text.trim() }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        setEditingMsg(null);
        setText('');
        addToast('Message edited', 'success');
      } else {
        const err = await response.json();
        addToast(err.error || 'Failed to edit message', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    setDeleteConfirmId(null);
    try {
      const response = await authFetch(`/api/messages/?message_id=${msgId}`, {
        method: 'DELETE',
      });
      if (response.ok || response.status === 204) {
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        addToast('Message deleted', 'success');
      } else {
        const err = await response.json();
        addToast(err.error || 'Failed to delete message', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
  };

  const toggleReaction = async (msgId, emoji) => {
    setEmojiPickerMsgId(null);
    // Optimistic update
    setMessages((prev) => prev.map((m) => {
      if (m.id !== msgId) return m;
      const reactions = [...(m.reactions || [])];
      const existing = reactions.find((r) => r.emoji === emoji);

      // Find and clear my current reaction (if any) before applying new one
      const myCurrentIdx = reactions.findIndex((r) => r.i_reacted);
      if (myCurrentIdx !== -1 && reactions[myCurrentIdx].emoji !== emoji) {
        const old = reactions[myCurrentIdx];
        old.count -= 1;
        old.i_reacted = false;
        old.users = old.users.filter((u) => u !== user?.username);
        if (old.count <= 0) {
          reactions.splice(myCurrentIdx, 1);
        }
      }

      if (existing) {
        if (existing.i_reacted) {
          // Remove my reaction
          existing.count -= 1;
          existing.i_reacted = false;
          existing.users = existing.users.filter((u) => u !== user?.username);
          if (existing.count <= 0) {
            return { ...m, reactions: reactions.filter((r) => r.emoji !== emoji) };
          }
        } else {
          // Add my reaction
          existing.count += 1;
          existing.i_reacted = true;
          existing.users.push(user?.username);
        }
      } else {
        reactions.push({ emoji, count: 1, i_reacted: true, users: [user?.username] });
      }
      return { ...m, reactions };
    }));

    try {
      await authFetch(`/api/messages/${msgId}/react/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      // Revert on failure — refetch messages
      fetchMessages(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !fileAttachment) || sending || isClosed) return;

    // Edit mode — save edit
    if (editingMsg) {
      return handleEditSave();
    }

    // Stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    wsSend({ type: 'typing', is_typing: false });

    setSending(true);
    try {
      // Text-only messages → send via WebSocket for instant delivery
      if (trimmed && !fileAttachment && connected) {
        const receiverId = isArtworkChat
          ? artist?.id
          : (user?.id === commission?.customer?.id ? commission?.artist?.id : commission?.customer?.id);

        wsSend({
          type: 'chat_message',
          message: {
            sender_id: user?.id,
            receiver_id: receiverId,
            body: trimmed,
            message_type: 'text',
            commission_id: commission?.id || undefined,
            artwork_id: artworkId || undefined,
            reply_to_id: replyTo?.id || undefined,
          },
        });
        // Message will arrive via WS echo — no need to add locally
      } else {
        // File messages or fallback → REST API
        const formData = new FormData();
        if (isArtworkChat) {
          formData.append('artwork_id', artworkId);
        } else {
          formData.append('commission_id', commission.id);
        }
        if (trimmed) formData.append('body', trimmed);
        if (fileAttachment) formData.append('attachment', fileAttachment);
        if (replyTo) formData.append('reply_to_id', replyTo.id);

        const response = await authFetch('/api/messages/', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const newMessage = await response.json();
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        } else {
          const err = await response.json();
          addToast(err.error || err.detail || 'Failed to send message', 'error');
          setSending(false);
          return;
        }
      }

      setText('');
      setFileAttachment(null);
      setFilePreview(null);
      setReplyTo(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTimeout(() => scrollToBottom(true), 50);
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

    // Send typing indicator
    if (connected && e.target.value.trim()) {
      wsSend({ type: 'typing', is_typing: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        wsSend({ type: 'typing', is_typing: false });
      }, 2000);
    }
  };

  const formatMessageTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFullDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <div className={`${embedded ? '' : 'rounded-lg border border-stone-200 bg-white'} relative flex flex-col h-full`}>
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
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 leading-tight">{otherName}</h3>
            <p className="text-xs text-stone-500">
              {isArtworkChat ? 'Inquiry Thread' : (isOtherArtist ? 'Artist' : 'Customer') + ' • Commission Thread'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-stone-300'}`} title={connected ? 'Connected' : 'Reconnecting...'} />
          <div className="text-xs text-stone-400 hidden sm:block">
            {isArtworkChat ? 'Inquiry' : 'Commission'}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-visible p-4 sm:p-5 space-y-5 bg-stone-50/40">
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
                    className={`flex items-end gap-2 flex-nowrap ${isMine ? 'justify-end' : 'justify-start'}`}
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
                      {/* Quoted Reply Preview */}
                      {msg.reply_to_object && (
                        <div className={`mb-2 px-2.5 py-1.5 rounded-md border-l-2 text-xs ${
                          isMine
                            ? 'bg-stone-800 border-stone-500 text-stone-400'
                            : 'bg-stone-50 border-stone-300 text-stone-500'
                        }`}>
                          <p className="font-semibold text-[11px]">{msg.reply_to_object.sender}</p>
                          <p className="truncate">{msg.reply_to_object.body || (msg.reply_to_object.message_type === 'image' ? '📷 Image' : '📎 File')}</p>
                        </div>
                      )}

                      {/* Attachment */}
                      {msg.attachment_url && (
                        <div className="mb-2">
                          {msg.message_type === 'image' ? (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="rounded-md max-h-64 w-full object-cover border border-stone-200/30"
                              />
                            </a>
                          ) : (
                            <a
                              href={msg.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-md border ${
                                isMine
                                  ? 'bg-stone-800 border-stone-700 hover:bg-stone-750'
                                  : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                              } transition-colors`}
                            >
                              <svg className="h-8 w-8 flex-shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <span className="text-xs font-medium truncate">{msg.attachment?.split('/').pop() || 'File'}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-medium ${
                          isMine ? 'text-stone-400' : 'text-stone-400'
                        }`}
                      >
                        {msg.edited_at && (
                          <span className="italic mr-0.5">edited</span>
                        )}
                        <span title={formatFullDateTime(msg.created_at)} className="cursor-default">
                          {formatMessageTime(msg.created_at)}
                        </span>
                        {isMine && (
                          <span title={msg.read_at ? 'Read' : 'Sent'}>
                            {msg.read_at ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>

                      {/* Message Actions — visible on hover */}
                      <div className={`absolute top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20 ${
                        isMine ? 'right-full mr-1' : 'left-full ml-1'
                      }`}>
                        {/* Reaction Button */}
                        <div className="relative" ref={emojiPickerMsgId === msg.id ? emojiPickerRef : undefined}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEmojiPickerMsgId(emojiPickerMsgId === msg.id ? null : msg.id); }}
                            className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-pink-500 transition-colors"
                            title="React"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                          </button>

                          {/* Emoji Picker */}
                          {emojiPickerMsgId === msg.id && (
                            <div className={`absolute top-full mt-1 flex gap-0.5 p-1.5 bg-white rounded-xl shadow-lg border border-stone-200 z-50 ${
                              isMine ? 'right-0' : 'left-0'
                            }`}>
                              {QUICK_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }}
                                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-stone-100 rounded-lg transition-colors hover:scale-110"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleReply(msg); }}
                          className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                          title="Reply"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                          </svg>
                        </button>

                        {/* Three-dot Menu */}
                        <div className="relative" ref={openMenuId === msg.id ? menuRef : undefined}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === msg.id ? null : msg.id); }}
                            className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
                            title="More"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                          </button>

                          {/* Dropdown Menu */}
                          {openMenuId === msg.id && (
                            <div className={`absolute top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50 ${
                              isMine ? 'right-0' : 'left-0'
                            }`}>
                              <button
                                onClick={() => handleCopy(msg)}
                                className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                                Copy
                              </button>
                              {isMine && (
                                <>
                                  <button
                                    onClick={() => handleEdit(msg)}
                                    className="w-full text-left px-3 py-2 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => { setDeleteConfirmId(msg.id); setOpenMenuId(null); }}
                                    className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reaction Badges */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-start' : 'justify-end'}`}>
                        {msg.reactions.map((r) => (
                          <div key={r.emoji} className="group relative inline-flex">
                            <button
                              onClick={() => toggleReaction(msg.id, r.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                                r.i_reacted
                                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              {r.count > 1 && <span className="font-medium">{r.count}</span>}
                            </button>
                            {r.i_reacted && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, r.emoji); }}
                                className="absolute inset-0 w-full h-full rounded-full bg-stone-800/70 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove reaction"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {otherTyping && (
        <div className="px-5 pb-1 pt-0">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span>{otherName} is typing...</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-xs w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-semibold text-stone-900">Delete message?</h4>
            <p className="text-xs text-stone-500 mt-1">This cannot be undone.</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 sm:p-4 border-t border-stone-100 bg-white relative">
        {isClosed ? (
          <div className="text-center py-2 px-4 rounded-xl bg-stone-100 text-xs text-stone-500 font-medium">
            This commission is closed. Messages can no longer be sent.
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-2">
            {/* Reply-To Preview Bar */}
            {replyTo && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 rounded-lg border border-stone-200 border-l-2 border-l-stone-400">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-stone-600">Replying to {replyTo.sender?.first_name || replyTo.sender?.username || 'message'}</p>
                  <p className="text-[11px] text-stone-400 truncate">{replyTo.body || (replyTo.message_type === 'image' ? '📷 Image' : '📎 File')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="p-0.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Edit Mode Banner */}
            {editingMsg && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 rounded-lg border border-amber-200">
                <svg className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
                <span className="text-[11px] font-medium text-amber-700 flex-1">Editing message</span>
                <button
                  type="button"
                  onClick={() => { setEditingMsg(null); setText(''); }}
                  className="p-0.5 rounded-full hover:bg-amber-100 text-amber-500 hover:text-amber-700"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* File Preview */}
            {filePreview && (
              <div className="flex items-center gap-2 px-2 py-1.5 bg-stone-50 rounded-lg border border-stone-200">
                {filePreview.type === 'image' ? (
                  <img src={filePreview.url} alt="" className="h-14 w-14 rounded-md object-cover border border-stone-200" />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-stone-100 flex items-center justify-center border border-stone-200">
                    <svg className="h-6 w-6 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-700 truncate">{filePreview.name}</p>
                  {filePreview.type === 'file' && (
                    <p className="text-[10px] text-stone-400">{(filePreview.size / 1024).toFixed(0)} KB</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* File Attach Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                title="Attach file"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />

              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={fileAttachment ? 'Add a caption...' : 'Type your message...'}
                rows={1}
                maxLength={4000}
                className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 transition max-h-32"
              />
              <button
                type="submit"
                disabled={(!text.trim() && !fileAttachment) || sending}
                className="rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 active:bg-stone-950 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 h-[42px]"
              >
                {sending ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : editingMsg ? (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline">Save</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden sm:inline">Send</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommissionChat;
