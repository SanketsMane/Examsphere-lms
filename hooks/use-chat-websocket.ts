import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-client';

const MESSAGE_TYPES = {
    JOIN_CHAT: 'join_chat',
    CHAT_MESSAGE: 'chat_message',
    READ_RECEIPT: 'read_receipt',
    ERROR: 'error',
    // Presence & Typing
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    USER_ONLINE_BATCH: 'user_online_batch',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop'
};

const BASE_RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 60000;
const MAX_RECONNECT_ATTEMPTS = 8;

export const useChatWebSocket = () => {
    const { data: session } = useAuth();
    const [isConnected, setIsConnected] = useState(false);

    // State for Presence and Typing
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({}); // { convId: [userIds] }

    const wsRef = useRef<WebSocket | null>(null);
    const unmountedRef = useRef(false);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attemptsRef = useRef(0);

    // Event listeners
    const onMessageReceivedRef = useRef<((message: any) => void) | null>(null);
    const onReadReceiptReceivedRef = useRef<((receipt: any) => void) | null>(null);

    const userId = session?.user?.id;

    const connect = useCallback(() => {
        if (!session?.user || unmountedRef.current) return;

        // No realtime server is deployed unless a host is configured; messaging still
        // works over HTTP, so skip the socket instead of retrying a dead endpoint forever.
        const host = process.env.NEXT_PUBLIC_WS_HOST;
        if (!host) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let ws: WebSocket;
        try {
            ws = new WebSocket(`${protocol}//${host}`);
        } catch {
            return;
        }

        ws.onopen = () => {
            attemptsRef.current = 0;
            setIsConnected(true);

            // @ts-ignore
            const token = session?.token || 'anonymous';
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.JOIN_CHAT,
                payload: { token }
            }));
        };

        ws.onmessage = (event) => {
            try {
                const { type, payload } = JSON.parse(event.data);
                switch (type) {
                    case MESSAGE_TYPES.CHAT_MESSAGE:
                        onMessageReceivedRef.current?.(payload);
                        break;
                    case MESSAGE_TYPES.READ_RECEIPT:
                        onReadReceiptReceivedRef.current?.(payload);
                        break;

                    // Presence
                    case MESSAGE_TYPES.USER_ONLINE:
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            next.add(payload.userId);
                            return next;
                        });
                        break;
                    case MESSAGE_TYPES.USER_OFFLINE:
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            next.delete(payload.userId);
                            return next;
                        });
                        break;
                    case MESSAGE_TYPES.USER_ONLINE_BATCH:
                        setOnlineUsers(new Set(payload.userIds));
                        break;

                    // Typing
                    case MESSAGE_TYPES.TYPING_START:
                        setTypingUsers(prev => {
                            const { conversationId, userId } = payload;
                            const current = prev[conversationId] || [];
                            if (!current.includes(userId)) {
                                return { ...prev, [conversationId]: [...current, userId] };
                            }
                            return prev;
                        });
                        break;
                    case MESSAGE_TYPES.TYPING_STOP:
                        setTypingUsers(prev => {
                            const { conversationId, userId } = payload;
                            const current = prev[conversationId] || [];
                            return { ...prev, [conversationId]: current.filter(id => id !== userId) };
                        });
                        break;
                }
            } catch {
                // Ignore malformed frames
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            if (wsRef.current === ws) wsRef.current = null;
            if (unmountedRef.current || attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) return;

            const delay = Math.min(BASE_RECONNECT_DELAY_MS * 2 ** attemptsRef.current, MAX_RECONNECT_DELAY_MS);
            attemptsRef.current += 1;
            reconnectTimerRef.current = setTimeout(connect, delay);
        };

        wsRef.current = ws;
        // Reconnect only when the signed-in user changes, not on every session object refresh
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        unmountedRef.current = false;
        attemptsRef.current = 0;
        if (userId) {
            connect();
        }
        return () => {
            unmountedRef.current = true;
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
            wsRef.current = null;
        };
    }, [userId, connect]);

    const send = (type: string, payload: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
    };

    const sendChatMessage = (receiverId: string, message: string, conversationId: string, messageId?: string) =>
        send(MESSAGE_TYPES.CHAT_MESSAGE, { receiverId, message, conversationId, messageId });

    const sendReadReceipt = (senderId: string, conversationId: string) =>
        send(MESSAGE_TYPES.READ_RECEIPT, { senderId, conversationId });

    const sendTypingStart = (receiverId: string, conversationId: string) =>
        send(MESSAGE_TYPES.TYPING_START, { receiverId, conversationId });

    const sendTypingStop = (receiverId: string, conversationId: string) =>
        send(MESSAGE_TYPES.TYPING_STOP, { receiverId, conversationId });

    const setOnMessageReceived = useCallback((cb: (msg: any) => void) => {
        onMessageReceivedRef.current = cb;
    }, []);

    const setOnReadReceiptReceived = useCallback((cb: (receipt: any) => void) => {
        onReadReceiptReceivedRef.current = cb;
    }, []);

    return {
        isConnected,
        onlineUsers, // Set<string>
        typingUsers, // { [convId]: string[] }
        sendChatMessage,
        sendReadReceipt,
        sendTypingStart,
        sendTypingStop,
        setOnMessageReceived,
        setOnReadReceiptReceived
    };
};
