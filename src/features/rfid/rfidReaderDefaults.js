// Same defaults as the app's reader settings form (impinjRfidShared.ts).
export const IMPINJ_DEFAULT_READER_SETTINGS = {
  readerName: 'Main RFID Reader',
  ipAddress: '192.168.1.10',
  port: 5084,
  connectionTimeoutMs: 10000,
  autoReconnect: true,
  reconnectIntervalMs: 5000,
  maxReconnectAttempts: 10,
  unlimitedReconnectAttempts: false,
  autoConnectOnStartup: true,
};
