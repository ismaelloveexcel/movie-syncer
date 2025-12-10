import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '@/lib/socket';
import { ICE_SERVERS } from '@/lib/constants';

interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
}

export function useVoiceChat(roomId: string, username: string) {
  const [isMuted, setIsMuted] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Create peer connection for a specific user
  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice-ice-candidate', roomId, peerId, event.candidate);
      }
    };

    // Handle incoming audio stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      
      // Create audio element for this peer
      let audioEl = audioElementsRef.current.get(peerId);
      if (!audioEl) {
        audioEl = new Audio();
        audioEl.autoplay = true;
        audioElementsRef.current.set(peerId, audioEl);
      }
      audioEl.srcObject = remoteStream;

      setConnectedPeers(prev => {
        if (!prev.includes(peerId)) {
          return [...prev, peerId];
        }
        return prev;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        cleanupPeer(peerId);
      }
    };

    peerConnectionsRef.current.set(peerId, { peerId, connection: pc });

    return pc;
  }, [roomId]);

  // Clean up a specific peer
  const cleanupPeer = useCallback((peerId: string) => {
    const peer = peerConnectionsRef.current.get(peerId);
    if (peer) {
      peer.connection.close();
      peerConnectionsRef.current.delete(peerId);
    }
    
    const audioEl = audioElementsRef.current.get(peerId);
    if (audioEl) {
      audioEl.srcObject = null;
      audioElementsRef.current.delete(peerId);
    }

    setConnectedPeers(prev => prev.filter(id => id !== peerId));
  }, []);

  // Start voice chat
  const startVoice = useCallback(async () => {
    try {
      setError(null);
      
      // Get user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false 
      });
      
      localStreamRef.current = stream;
      
      // Start muted by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      
      setIsVoiceActive(true);
      setIsMuted(true);
      
      // Notify server we're ready for voice
      socket.emit('voice-join', roomId, username);
      
    } catch (err: any) {
      console.error('Failed to get microphone:', err);
      setError('Could not access microphone. Please allow microphone access.');
    }
  }, [roomId, username]);

  // Stop voice chat
  const stopVoice = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((peer, peerId) => {
      cleanupPeer(peerId);
    });

    setIsVoiceActive(false);
    setIsMuted(true);
    setConnectedPeers([]);
    
    socket.emit('voice-leave', roomId);
  }, [roomId, cleanupPeer]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const newMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!roomId) return;

    // When another user joins voice chat
    socket.on('voice-user-joined', async (peerId: string, peerUsername: string) => {
      if (!isVoiceActive) return;
      
      console.log(`${peerUsername} joined voice, creating offer...`);
      
      const pc = createPeerConnection(peerId, true);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice-offer', roomId, peerId, offer);
      } catch (err) {
        console.error('Failed to create offer:', err);
      }
    });

    // Handle incoming offer
    socket.on('voice-offer', async (peerId: string, offer: RTCSessionDescriptionInit) => {
      if (!isVoiceActive) return;
      
      console.log('Received voice offer from', peerId);
      
      const pc = createPeerConnection(peerId, false);
      
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice-answer', roomId, peerId, answer);
      } catch (err) {
        console.error('Failed to handle offer:', err);
      }
    });

    // Handle answer
    socket.on('voice-answer', async (peerId: string, answer: RTCSessionDescriptionInit) => {
      const peer = peerConnectionsRef.current.get(peerId);
      if (peer) {
        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Failed to set remote description:', err);
        }
      }
    });

    // Handle ICE candidate
    socket.on('voice-ice-candidate', async (peerId: string, candidate: RTCIceCandidateInit) => {
      const peer = peerConnectionsRef.current.get(peerId);
      if (peer) {
        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add ICE candidate:', err);
        }
      }
    });

    // When a user leaves voice
    socket.on('voice-user-left', (peerId: string) => {
      cleanupPeer(peerId);
    });

    return () => {
      socket.off('voice-user-joined');
      socket.off('voice-offer');
      socket.off('voice-answer');
      socket.off('voice-ice-candidate');
      socket.off('voice-user-left');
    };
  }, [roomId, isVoiceActive, createPeerConnection, cleanupPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [stopVoice]);

  return {
    isMuted,
    isVoiceActive,
    connectedPeers,
    error,
    startVoice,
    stopVoice,
    toggleMute,
  };
}
