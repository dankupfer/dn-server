// test-voice-ws.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/api/voice');

ws.on('open', () => {
  console.log('✅ Connected to voice WebSocket');
  
  // Start a session
  const startMessage = {
    action: 'start_session',
    sessionId: 'test-session-123'
  };
  
  console.log('📤 Sending start_session message...');
  ws.send(JSON.stringify(startMessage));
  
  // Send a mock audio chunk after 1 second
  setTimeout(() => {
    const audioMessage = {
      action: 'audio_chunk',
      sessionId: 'test-session-123',
      audioData: 'base64-encoded-audio-data-here'
    };
    
    console.log('📤 Sending audio_chunk message...');
    ws.send(JSON.stringify(audioMessage));
  }, 1000);
  
  // End session after 2 seconds
  setTimeout(() => {
    const endMessage = {
      action: 'end_session',
      sessionId: 'test-session-123'
    };
    
    console.log('📤 Sending end_session message...');
    ws.send(JSON.stringify(endMessage));
    
    // Close connection
    setTimeout(() => {
      ws.close();
    }, 500);
  }, 2000);
});

ws.on('message', (data) => {
  console.log('📥 Received:', data.toString());
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

ws.on('error', (error) => {
  console.error('❌ Error:', error.message);
});