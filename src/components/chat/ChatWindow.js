// src/components/chat/ChatWindow.js
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ChatWindow = ({ emergencyId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Load initial messages manually first
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!emergencyId) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log('Loading initial messages for emergency:', emergencyId);
        
        const messagesRef = collection(db, 'chat_messages');
        const q = query(
          messagesRef,
          where('emergencyId', '==', emergencyId),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        
        const querySnapshot = await getDocs(q);
        const messageList = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messageList.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            // Add local timestamp for messages that don't have server timestamp yet
            localTimestamp: new Date()
          });
        });
        
        // Sort in ascending order (oldest first)
        messageList.sort((a, b) => {
          const timeA = a.timestamp || a.localTimestamp;
          const timeB = b.timestamp || b.localTimestamp;
          return timeA - timeB;
        });
        
        console.log('Loaded', messageList.length, 'initial messages');
        setMessages(messageList);
      } catch (err) {
        console.error('Error loading initial messages:', err);
        setError('Failed to load chat messages: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialMessages();
  }, [emergencyId]);
  
  // Set up real-time listener AFTER initial load
  useEffect(() => {
    if (!emergencyId || loading) return;
    
    console.log('Setting up real-time chat listener');
    
    const messagesRef = collection(db, 'chat_messages');
    const q = query(
      messagesRef,
      where('emergencyId', '==', emergencyId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = [];
      
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const message = {
          id: change.doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          localTimestamp: new Date()
        };
        
        if (change.type === 'added') {
          console.log('New message received:', message.id);
          newMessages.push(message);
        }
      });
      
      if (newMessages.length > 0) {
        setMessages(prev => {
          // Combine existing and new messages, removing duplicates
          const combined = [...prev];
          
          newMessages.forEach(newMsg => {
            // Check if this message already exists
            const exists = combined.some(msg => msg.id === newMsg.id);
            if (!exists) {
              combined.push(newMsg);
            }
          });
          
          // Sort messages by timestamp
          combined.sort((a, b) => {
            const timeA = a.timestamp || a.localTimestamp;
            const timeB = b.timestamp || b.localTimestamp;
            return timeA - timeB;
          });
          
          return combined;
        });
      }
    }, (err) => {
      console.error('Error in chat listener:', err);
      setError('Failed to receive new messages: ' + err.message);
    });
    
    return () => unsubscribe();
  }, [emergencyId, loading]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !emergencyId) return;
    if (sending) return;
    
    // Create the message with a local timestamp for immediate display
    const messageData = {
      emergencyId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'User',
      text: newMessage.trim(),
      timestamp: serverTimestamp()
    };
    
    // Create a temporary optimistic message for the UI
    const optimisticMessage = {
      id: 'temp-' + Date.now(),
      ...messageData,
      timestamp: null,
      localTimestamp: new Date(),
      pending: true
    };
    
    // Add the optimistic message to state immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage(''); // Clear input right away
    
    try {
      setSending(true);
      console.log('Sending message to Firestore:', messageData);
      
      // Send the actual message to Firestore
      const docRef = await addDoc(collection(db, 'chat_messages'), messageData);
      console.log('Message sent with ID:', docRef.id);
      
      // Remove temporary message (it will be replaced by the real one from onSnapshot)
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Restore the message text so the user can try again
      setNewMessage(messageData.text);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-3 border-b">
        <h3 className="font-semibold">Emergency Chat</h3>
      </div>
      
      <div className="h-64 overflow-y-auto p-3 bg-white">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading messages...</p>
        ) : error ? (
          <div className="text-center text-red-500 py-2">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-500 underline mt-2"
            >
              Reload
            </button>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-3 ${message.senderId === currentUser.uid ? 'text-right' : ''}`}
            >
              <div 
                className={`inline-block p-2 rounded-lg max-w-xs ${
                  message.senderId === currentUser.uid 
                    ? message.pending ? 'bg-blue-300 text-white' : 'bg-blue-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {message.senderName} • {message.timestamp ? 
                  message.timestamp.toLocaleTimeString() : 
                  message.pending ? 'Sending...' : 'Just now'}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="border-t p-2 flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow border rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          className={`px-4 rounded-r text-white ${
            sending ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'
          }`}
          disabled={sending}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;