import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '@/lib/socket';
import { ICE_SERVERS } from '@/lib/constants';

export function useScreenShare(roomId: string, username: string) {
  const [isSharing, setIsSharing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [sharerName, setSharerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('screen-ice-candidate', roomId, {
          candidate: event.candidate,
          username,
        });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsViewing(true);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        stopViewing();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [roomId, username]);

  const startScreenShare = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('screen-offer', roomId, {
        offer,
        username,
      });

      setIsSharing(true);

      socket.emit('screen-started', roomId, { username });

      // Handle when user stops via browser UI
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err: any) {
      console.error('Screen share error:', err);
      setError('Could not start screen sharing');
    }
  }, [roomId, username, createPeerConnection]);

  const stopScreenShare = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setIsSharing(false);
    socket.emit('screen-stopped', roomId);
  }, [roomId]);

  const stopViewing = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsViewing(false);
    setSharerName(null);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // Handle incoming screen offer
    const handleScreenOffer = async (data: { offer: RTCSessionDescriptionInit; username: string }) => {
      if (isSharing) return;

      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('screen-answer', roomId, {
          answer,
          username,
        });

        setSharerName(data.username);
      } catch (err) {
        console.error('Error handling screen offer:', err);
      }
    };

    const handleScreenAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } catch (err) {
          console.error('Error handling screen answer:', err);
        }
      }
    };

    const handleScreenIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    };

    const handleScreenStarted = (data: { username: string }) => {
      if (!isSharing) {
        setSharerName(data.username);
      }
    };

    const handleScreenStopped = () => {
      stopViewing();
    };

    socket.on('screen-offer', handleScreenOffer);
    socket.on('screen-answer', handleScreenAnswer);
    socket.on('screen-ice-candidate', handleScreenIceCandidate);
    socket.on('screen-started', handleScreenStarted);
    socket.on('screen-stopped', handleScreenStopped);

    return () => {
      socket.off('screen-offer', handleScreenOffer);
      socket.off('screen-answer', handleScreenAnswer);
      socket.off('screen-ice-candidate', handleScreenIceCandidate);
      socket.off('screen-started', handleScreenStarted);
      socket.off('screen-stopped', handleScreenStopped);
    };
  }, [roomId, isSharing, username, createPeerConnection, stopViewing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSharing) {
        stopScreenShare();
      }
      if (isViewing) {
        stopViewing();
      }
    };
  }, [isSharing, isViewing, stopScreenShare, stopViewing]);

  return {
    isSharing,
    isViewing,
    sharerName,
    error,
    localVideoRef,
    remoteVideoRef,
    startScreenShare,
    stopScreenShare,
    stopViewing,
  };
}
