export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const STORAGE_KEYS = {
  USERNAME: 'fms_username',
} as const;

export const ADMIN_NAME = 'Ismael';
