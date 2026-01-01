export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65c92c62d5e8c6d7',
      credential: 'uWdWNmkhvyqTmFxQ',
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'e8dd65c92c62d5e8c6d7',
      credential: 'uWdWNmkhvyqTmFxQ',
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65c92c62d5e8c6d7',
      credential: 'uWdWNmkhvyqTmFxQ',
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65c92c62d5e8c6d7',
      credential: 'uWdWNmkhvyqTmFxQ',
    },
  ],
  iceCandidatePoolSize: 10,
};

export const STORAGE_KEYS = {
  USERNAME: 'fms_username',
} as const;

export const ADMIN_NAME = 'Ismael';
