'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Mensagem, Usuario } from '@/types';
import { Send, Paperclip, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatProps {
  currentUser: Usuario;
  otherUser: Usuario;
}

export function Chat({ currentUser, otherUser }: ChatProps) {
  const [messages, setMessages] = useState<Mensagem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
    subscribeToTyping();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUser.id, otherUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select(`*, remetente:usuarios!remetente_id(*)`)
        .or(`remetente_id.eq.${currentUser.id},destinatario_id.eq.${currentUser.id}`)
        .or(`remetente_id.eq.${otherUser.id},destinatario_id.eq.${otherUser.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    const subscription = supabase
      .channel(`chat:${currentUser.id}:${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `remetente_id=eq.${otherUser.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Mensagem;
          
          // Fetch sender info
          const { data: senderData } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', newMsg.remetente_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, remetente: senderData }]);
          await markMessagesAsRead();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }

  function subscribeToTyping() {
    const channel = supabase.channel(`typing:${currentUser.id}:${otherUser.id}`);
    
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId === otherUser.id) {
        setIsTyping(true);
        
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('mensagens')
        .insert({
          remetente_id: currentUser.id,
          destinatario_id: otherUser.id,
          conteudo: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  async function handleTyping() {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Broadcast typing event
    await supabase.channel(`typing:${currentUser.id}:${otherUser.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUser.id },
    });

    typingTimeoutRef.current = setTimeout(stopTyping, 1000);
  }

  function stopTyping() {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }

  async function markMessagesAsRead() {
    try {
      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('destinatario_id', currentUser.id)
        .eq('remetente_id', otherUser.id)
        .eq('lida', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatMessageDate(dateString: string) {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-bg-surface border-b border-border p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-medium">
              {otherUser.nome?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-text-primary">{otherUser.nome}</p>
            {isTyping && (
              <p className="text-sm text-text-secondary">Digitando...</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.remetente_id === currentUser.id;
          
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwn
                    ? 'bg-primary text-white'
                    : 'bg-bg-surface text-text-primary'
                }`}
              >
                <p className="text-sm">{message.conteudo}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${isOwn ? 'text-primary-light' : 'text-text-secondary'}`}>
                    {formatMessageDate(message.created_at)}
                  </span>
                  {isOwn && (
                    <span className="ml-2">
                      {message.lida ? (
                        <CheckCheck className="w-3 h-3 text-primary-light" />
                      ) : (
                        <Check className="w-3 h-3 text-text-secondary" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-bg-surface border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}