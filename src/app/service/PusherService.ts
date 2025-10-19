import {Injectable} from '@angular/core';
import Pusher, {Channel} from 'pusher-js';
import {BehaviorSubject} from 'rxjs';
import {Connect} from '../services/connect';
import ToastrService from '../toastr-service-wrapper.service';

interface PusherInitConfig {
    key: string;
    cluster: string;
    userId?: number;
}

@Injectable({
    providedIn: 'root',
})
export class PusherService {
    private pusher: Pusher;
    private userChannel: Channel;
    private channelReady = new BehaviorSubject<boolean>(false);
    private listeners: { [key: string]: ((data: any) => void)[] } = {};
    private eventQueue: Array<{
        event: string;
        callback: (data: any) => void;
    }> = [];
    private pendingOperations: number = 0;
    private config: PusherInitConfig;
    private isDisconnecting: boolean = false;  // Track disconnection state to prevent race conditions
    private pendingSubscriptions: Set<string> = new Set();  // Track pending channel subscriptions

    private initializationState = {
        connected: false,
        userDataFetched: false,
        channelSubscribed: false,
        lastError: null as Error | null,
        lastAttempt: null as Date | null,
        subscriptionAttempts: 0
    };

    private readonly maxSubscriptionAttempts = 3;

    private retrySubscription(channelName: string, attempt: number = 1): void {
        if (attempt > this.maxSubscriptionAttempts) {
            console.error('[Pusher] Max subscription attempts reached:', {
                maxAttempts: this.maxSubscriptionAttempts,
                channelName,
                lastError: this.initializationState.lastError?.message,
                timestamp: new Date().toISOString()
            });
            return;
        }

        console.log(`[Pusher] Subscription attempt ${attempt}/${this.maxSubscriptionAttempts}:`, {
            channelName,
            lastAttempt: this.initializationState.lastAttempt?.toISOString(),
            timestamp: new Date().toISOString()
        });

        this.initializationState.subscriptionAttempts = attempt;
        this.initializationState.lastAttempt = new Date();

        setTimeout(() => {
            if (!this.userChannel?.subscribed) {
                this.userChannel = this.pusher.subscribe(channelName);
            }
        }, Math.min(1000 * Math.pow(2, attempt - 1), 5000));
    }

    constructor(private _connect: Connect, private toasterService: ToastrService) {
        // No initialization in constructor
    }

    public initialize(config: PusherInitConfig): void {
        if (!config.key || !config.cluster) {
            console.error('Invalid Pusher config:', config);
            return;
        }
        this.config = config;
    }

    private connect(): void {
        if (this.pusher || !this.config) return;

        if (!this.config.key || !this.config.cluster) {
            console.error('Invalid Pusher config:', this.config);
            return;
        }

        this.pusher = new Pusher(this.config.key, {
            cluster: this.config.cluster,
            authTransport: 'ajax',
            authEndpoint: '/admin/pusher/auth',
            auth: {
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            authorizer: (channel) => ({
                authorize: async (socketId, callback) => {
                    console.log('[Pusher] Authorizing channel:', {
                        channel: channel.name,
                        socketId,
                        timestamp: new Date().toISOString()
                    });
                    const subscription = this._connect.post('/admin/pusher/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    }).subscribe({
                        next: (response) => {
                            callback(null, response);
                            subscription.unsubscribe();
                        },
                        error: (error) => {
                            console.error('[Pusher] Auth error:', {
                                error: error?.message || error,
                                channel: channel.name,
                                socketId,
                                timestamp: new Date().toISOString()
                            });
                            this.toasterService.warning('チャンネルの認証に失敗しました。CSVログから、結果を確認してください。', '警告');
                            callback(new Error('Pusher authentication failed'), null);
                            subscription.unsubscribe();
                        }
                    }).add(() => {
                        if (!this.isDisconnecting && this.pusher && !this.userChannel?.subscribed) {
                            setTimeout(() => {
                                if (!this.isDisconnecting && this.pusher) {
                                    console.log('[Pusher] Retrying channel subscription');
                                    this.userChannel = this.pusher.subscribe(channel.name);
                                } else {
                                    console.log('[Pusher] Skipping subscription retry - cleanup in progress');
                                }
                            }, 1000);
                        }
                    });
                }
            })
        });

        // Subscribe to private channel immediately
        if (this.config.userId) {
            const channelName = `private-user-${this.config.userId}`;
            console.log('[Pusher] Attempting channel subscription:', {
                channelName,
                timestamp: new Date().toISOString()
            });

            // Create channel instance and track subscription
            this.pendingSubscriptions.add(channelName);
            this.userChannel = this.pusher.subscribe(channelName);

            // Bind to events before subscription completes
            this.userChannel.bind('pusher:subscription_succeeded', () => {
                console.log('[Pusher] Channel subscription succeeded:', {
                    channelName,
                    subscribed: this.userChannel?.subscribed || false,
                    timestamp: new Date().toISOString()
                });

                this.initializationState.channelSubscribed = true;
                this.initializationState.lastError = null;
                this.channelReady.next(true);
                this.processEventQueue();
            });

            // Handle subscription errors
            this.userChannel.bind('pusher:subscription_error', (error: any) => {
                console.error('[Pusher] Channel subscription failed:', {
                    error: error?.message || error,
                    channelState: this.userChannel?.subscribed ? 'subscribed' : 'unsubscribed',
                    timestamp: new Date().toISOString()
                });

                this.initializationState.lastError = error;
                this.initializationState.channelSubscribed = false;
                this.channelReady.next(false);
                this.toasterService.warning('チャンネルの認証に失敗しました。CSVログから、結果を確認してください。', '警告');

                // Retry subscription with exponential backoff
                this.retrySubscription(channelName, this.initializationState.subscriptionAttempts + 1);
            });
        } else {
            console.warn('No user ID provided in config');
            this.channelReady.next(false);
        }

        // Monitor connection state for logging only
        this.pusher.connection.bind('state_change', (states: { current: string, previous: string }) => {
            console.log('[Pusher] Connection state changed:', {
                previous: states.previous,
                current: states.current,
                initState: this.initializationState,
                timestamp: new Date().toISOString()
            });

            this.initializationState.connected = states.current === 'connected';
            this.initializationState.lastAttempt = new Date();

            if (states.current === 'connected') {
                console.log('[Pusher] Connected, initializing channel...');
                this.initializationState.userDataFetched = true;

                if (this.config.userId) {
                    const channelName = `private-user-${this.config.userId}`;
                    console.log('[Pusher] Attempting channel subscription:', {
                        channelName,
                        initState: this.initializationState,
                        timestamp: new Date().toISOString()
                    });


                    // Unsubscribe from previous channel if exists
                    if (this.userChannel) {
                        console.log('[Pusher] Unsubscribing from previous channel:', {
                            channelName: this.userChannel.name,
                            subscribed: this.userChannel?.subscribed || false,
                            initState: this.initializationState
                        });
                        this.pusher.unsubscribe(channelName);
                    }

                    // Create channel instance first
                    this.userChannel = this.pusher.channel(channelName) || this.pusher.subscribe(channelName);

                    // Bind to events before subscription completes
                    this.userChannel.bind('pusher:subscription_succeeded', () => {
                        console.log('[Pusher] Channel subscription succeeded:', {
                            channelName,
                            subscribed: this.userChannel?.subscribed || false,
                            initState: this.initializationState,
                            timestamp: new Date().toISOString()
                        });

                        this.initializationState.channelSubscribed = true;
                        this.initializationState.lastError = null;
                        this.channelReady.next(true);
                        this.processEventQueue();
                    });

                    // Handle subscription errors
                    this.userChannel.bind('pusher:subscription_error', (error: any) => {
                        console.error('[Pusher] Channel subscription failed:', {
                            error: error?.message || error,
                            channelState: this.userChannel?.subscribed ? 'subscribed' : 'unsubscribed',
                            initState: this.initializationState,
                            timestamp: new Date().toISOString()
                        });

                        this.initializationState.lastError = error;
                        this.initializationState.channelSubscribed = false;
                        this.channelReady.next(false);

                        // Retry subscription with exponential backoff
                        this.retrySubscription(channelName, this.initializationState.subscriptionAttempts + 1);
                    });
                } else {
                    console.warn('No user ID provided in config');
                    this.channelReady.next(false);
                }
            }
        });
    }

    private disconnect(): void {
        if (!this.pusher || this.isDisconnecting) {
            console.log('[Pusher] Already disconnecting, skipping');
            return;
        }
        try {
            this.cleanup();
        } catch (e) {
            console.error('[Pusher] Error during cleanup:', e);
        } finally {
            this.isDisconnecting = false;
            this.pusher = null;
        }
    }

    private incrementCount(): void {
        this.pendingOperations++;
        if (this.pendingOperations > 0) {
            this.connect();
        }
    }

    private decrementCount(): void {
        this.pendingOperations = Math.max(0, this.pendingOperations - 1);
        console.log('[Pusher] Pending operations:', this.pendingOperations)
        if (this.pendingOperations === 0) {
            this.disconnect();
        }
    }

    public finishOperation(): void {
        try {
            this.decrementCount();
        } catch (e) {
            console.error('[Pusher] Error during operation cleanup:', e);
            this.pendingOperations = 0;
            this.disconnect();
        }
    }

    public bindJobFinished(callback: (data: any) => void): void {
        this.incrementCount();
        if (!this.pusher) {
            this.connect();
        }
        if (this.channelReady.value && this.userChannel) {
            this.userChannel.bind('job-finished', (data) => {
                callback(data);
                this.decrementCount();
            });
            this.listeners['job-finished'] = [callback];
        } else {
            this.eventQueue.push({event: 'job-finished', callback});
            console.log('Channel not ready, queued job-finished event');
        }
    }

    public bindUploadProgress(callback: (data: any) => void): void {
        this.incrementCount();

        if (!this.pusher) {
            this.connect();
        }

        this.channelReady.subscribe((isReady) => {
            if (isReady) {
                if (this.userChannel) {
                    // Ensure we don't bind multiple times
                    if (!this.listeners['upload-progress']) {
                        this.listeners['upload-progress'] = [];
                    }
                    this.userChannel.bind('upload-progress', (data: any) => {
                        this.listeners['upload-progress'].forEach((cb) => cb(data));
                    });

                    this.listeners['upload-progress'].push(callback);
                }
            } else {
                console.log('Channel not ready, retrying in 500ms...');

            }
        });
    }


    public bindCsvUploadFinished(callback: (data: any) => void): void {
        this.incrementCount();
        if (!this.pusher) {
            this.connect();
        }
        this.channelReady.subscribe((isReady) => {
            if (isReady && this.userChannel) {
                this.userChannel.bind('upload-finished', (data: any) => {
                    this.listeners['upload-finished'] = [callback];
                    callback(data);
                    this.decrementCount();
                });
            } else {
                console.log('Channel not ready, will retry when ready');
            }
        });
    }

    public bindUploadFinished(callback: (data: any) => void): void {
        this.incrementCount();
        if (!this.pusher) {
            this.connect();
        }
        if (this.channelReady.value && this.userChannel) {
            this.userChannel.bind('upload-finished', (data) => {
                callback(data);
                this.decrementCount();
            });
            this.listeners['upload-finished'] = [callback];
        } else {
            this.eventQueue.push({event: 'upload-finished', callback});
            console.log('Channel not ready, queued upload-finished event');
        }
    }

    private processEventQueue(): void {
        if (this.channelReady.value && this.userChannel) {
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                if (event) {
                    this.userChannel.bind(event.event, event.callback);
                    this.listeners[event.event] = [event.callback];
                }
            }
        }
    }

    public bindTmpDatabaseCompleted(callback: (data: any) => void): void {
        this.incrementCount();
        if (!this.pusher) {
            this.connect();
        }
        if (this.channelReady.value && this.userChannel) {
            this.userChannel.bind('tmp-database-completed', (data) => {
                callback(data);
                this.decrementCount();
            });
            this.listeners['tmp-database-completed'] = [callback];
        } else {
            this.eventQueue.push({
                event: 'tmp-database-completed',
                callback: (data) => {
                    callback(data);
                    this.decrementCount();
                }
            });
            this.channelReady.subscribe((isReady) => {
                if (isReady && this.userChannel) {
                    this.userChannel.bind('tmp-database-completed', (data: any) => {
                        this.listeners['tmp-database-completed'] = [callback];
                        callback(data);
                        this.decrementCount();
                    });
                } else {
                    console.log('[Pusher] Channel not ready for tmp-database-completed binding');
                }
            });
        }
    }

    public unbind(eventName: string): void {
        if (this.listeners[eventName]?.length && this.userChannel) {
            this.userChannel.unbind(eventName);
            this.listeners[eventName] = [];
        }
    }

    public isChannelReady(): boolean {
        // If we have no config, we can initialize
        if (!this.config) {
            return true;
        }

        // If we're not connected, we can initialize
        if (!this.pusher) {
            return true;
        }

        // If we are connected, check if channel is ready
        const ready = this.channelReady.value &&
            !!this.userChannel &&
            this.userChannel.subscribed &&
            this.initializationState.connected &&
            this.initializationState.userDataFetched &&
            this.initializationState.channelSubscribed;

        console.log('[Pusher] Channel ready check:', {
            channelReadyValue: this.channelReady.value,
            hasUserChannel: !!this.userChannel,
            subscribed: this.userChannel?.subscribed,
            initState: this.initializationState,
            lastError: this.initializationState.lastError?.message,
            lastAttempt: this.initializationState.lastAttempt?.toISOString(),
            subscriptionAttempts: this.initializationState.subscriptionAttempts,
            result: ready,
            timestamp: new Date().toISOString()
        });
        return ready;
    }

    public cleanup(): void {
        if (this.isDisconnecting) {
            console.log('[Pusher] Already disconnecting, skipping cleanup');
            return;
        }
        this.isDisconnecting = true;

        console.log('[Pusher] Cleaning up:', {
            previousState: this.initializationState,
            queueSize: this.eventQueue.length,
            timestamp: new Date().toISOString()
        });

        this.eventQueue = [];
        this.channelReady.next(false);
        this.pendingOperations = 0;
        this.pendingSubscriptions.clear(); // Clear pending subscriptions

        if (this.pusher) {
            try {
                console.log('[Pusher] Disconnecting from Pusher');
                this.pusher.disconnect(); // これで全てのチャンネルを解除し、WebSocketを閉じる
            } catch (e) {
                console.error('[Pusher] Error during disconnect:', e);
            } finally {
                this.pusher = null;
            }
        }

        this.initializationState = {
            connected: false,
            userDataFetched: false,
            channelSubscribed: false,
            lastError: null,
            lastAttempt: new Date(),
            subscriptionAttempts: 0
        };

        this.userChannel = null;
        this.isDisconnecting = false;
    }

}
