/**
 * Transaction Queue Manager
 * Ensures transactions are sent sequentially without nonce conflicts
 * Tracks pending file hashes to prevent duplicate submissions
 */

class TransactionQueue {
    private queue: Array<() => Promise<any>> = [];
    private processing = false;
    private lastTransactionTime = 0;
    private readonly MIN_DELAY = 3000; // 3 seconds between transactions for safety
    private pendingHashes = new Set<string>(); // Track hashes being processed
    private recentHashes = new Map<string, number>(); // Track recently processed hashes with timestamp

    async add<T>(transaction: () => Promise<T>, fileHash?: string): Promise<T> {
        // If fileHash provided, check if it's already being processed or was recently processed
        if (fileHash) {
            // Check if currently being processed
            if (this.pendingHashes.has(fileHash)) {
                console.log('❌ Certificate already being processed in queue');
                throw new Error('This certificate is already being uploaded. Please wait for the current upload to complete.');
            }

            // Check if recently processed (within last 30 seconds)
            const recentTime = this.recentHashes.get(fileHash);
            if (recentTime && Date.now() - recentTime < 30000) {
                console.log('❌ Certificate was recently uploaded');
                throw new Error('This certificate was just uploaded. Please wait a moment before trying again.');
            }

            // Mark as pending
            this.pendingHashes.add(fileHash);
        }

        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    // Ensure minimum delay between transactions
                    const now = Date.now();
                    const timeSinceLastTx = now - this.lastTransactionTime;
                    if (timeSinceLastTx < this.MIN_DELAY && this.lastTransactionTime > 0) {
                        const waitTime = this.MIN_DELAY - timeSinceLastTx;
                        console.log(`⏳ Queue delay: waiting ${waitTime}ms before next transaction...`);
                        await new Promise(r => setTimeout(r, waitTime));
                    }

                    const result = await transaction();
                    this.lastTransactionTime = Date.now();
                    
                    // Mark as recently processed
                    if (fileHash) {
                        this.recentHashes.set(fileHash, Date.now());
                        // Clean up old entries after 60 seconds
                        setTimeout(() => {
                            this.recentHashes.delete(fileHash);
                        }, 60000);
                    }
                    
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    // Remove from pending
                    if (fileHash) {
                        this.pendingHashes.delete(fileHash);
                    }
                }
            });

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    private async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const transaction = this.queue.shift();
            if (transaction) {
                try {
                    await transaction();
                } catch (error) {
                    console.error('Transaction queue error:', error);
                }
            }
        }

        this.processing = false;
    }

    getQueueLength(): number {
        return this.queue.length;
    }

    isProcessing(): boolean {
        return this.processing;
    }

    isPending(fileHash: string): boolean {
        return this.pendingHashes.has(fileHash);
    }

    wasRecentlyProcessed(fileHash: string): boolean {
        const recentTime = this.recentHashes.get(fileHash);
        return recentTime ? Date.now() - recentTime < 30000 : false;
    }
}

// Global transaction queue instance
export const txQueue = new TransactionQueue();
