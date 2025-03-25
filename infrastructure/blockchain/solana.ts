/**
 * Solana blockchain integration for BioDaptor
 * Provides functionality to interact with the Solana blockchain
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  sendAndConfirmTransaction,
  clusterApiUrl,
  Cluster,
  TransactionInstruction,
} from '@solana/web3.js';
import { BlockchainTransaction } from '@shared/types';

/**
 * Configuration options for Solana client
 */
export interface SolanaClientConfig {
  endpoint: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
  wsEndpoint?: string;
}

/**
 * Default Solana client configuration
 */
const DEFAULT_CONFIG: SolanaClientConfig = {
  endpoint: process.env.SOLANA_ENDPOINT || clusterApiUrl('devnet'),
  commitment: 'confirmed',
};

/**
 * Solana client wrapper class for BioDaptor
 */
export class SolanaClient {
  private connection: Connection;
  private config: SolanaClientConfig;

  /**
   * Create a new Solana client
   * @param config Optional client configuration
   */
  constructor(config: Partial<SolanaClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connection = new Connection(this.config.endpoint, {
      commitment: this.config.commitment,
      wsEndpoint: this.config.wsEndpoint,
    });
  }

  /**
   * Get the Solana connection
   * @returns The active Solana connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Change the endpoint used by the client
   * @param endpoint New endpoint URL
   * @param cluster Optional cluster name to use a predefined endpoint
   */
  setEndpoint(endpoint?: string, cluster?: Cluster): void {
    const newEndpoint = endpoint || (cluster ? clusterApiUrl(cluster) : this.config.endpoint);
    this.config.endpoint = newEndpoint;
    this.connection = new Connection(newEndpoint, {
      commitment: this.config.commitment,
      wsEndpoint: this.config.wsEndpoint,
    });
  }

  /**
   * Get account information for a public key
   * @param publicKey Account public key
   * @returns Account info or null if not found
   */
  async getAccountInfo(publicKey: string | PublicKey): Promise<any> {
    const key = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
    return this.connection.getAccountInfo(key);
  }

  /**
   * Get account balance for a public key
   * @param publicKey Account public key
   * @returns Account balance in lamports
   */
  async getBalance(publicKey: string | PublicKey): Promise<number> {
    const key = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
    return this.connection.getBalance(key);
  }

  /**
   * Send SOL tokens to another account
   * @param amount Amount in SOL (not lamports)
   * @param to Recipient public key
   * @param keypair Sender keypair
   * @returns Transaction signature
   */
  async sendSol(
    amount: number,
    to: string | PublicKey,
    keypair: Keypair
  ): Promise<string> {
    const toKey = typeof to === 'string' ? new PublicKey(to) : to;
    const lamports = amount * 1_000_000_000; // Convert SOL to lamports

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toKey,
        lamports,
      })
    );

    return sendAndConfirmTransaction(this.connection, transaction, [keypair]);
  }

  /**
   * Send a transaction with custom instructions
   * @param instructions Transaction instructions
   * @param signers Transaction signers
   * @returns Transaction signature
   */
  async sendTransaction(
    instructions: TransactionInstruction | TransactionInstruction[],
    signers: Keypair[]
  ): Promise<string> {
    const transaction = new Transaction();

    if (Array.isArray(instructions)) {
      transaction.add(...instructions);
    } else {
      transaction.add(instructions);
    }

    return sendAndConfirmTransaction(this.connection, transaction, signers);
  }

  /**
   * Get transaction details
   * @param signature Transaction signature
   * @returns Formatted transaction details
   */
  async getTransaction(signature: string): Promise<BlockchainTransaction | null> {
    try {
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
      });

      if (!tx) return null;

      return {
        hash: signature,
        blockNumber: tx.slot,
        timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        from: tx.transaction.message.accountKeys[0].toString(),
        to: tx.transaction.message.accountKeys[1].toString(),
        value: (tx.meta?.postBalances[1] || 0) - (tx.meta?.preBalances[1] || 0) + ' lamports',
        status: tx.meta?.err ? 'failed' : 'confirmed',
        metadata: {
          logs: tx.meta?.logMessages || [],
          fee: tx.meta?.fee || 0,
        },
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Create a new Solana keypair
   * @returns New keypair
   */
  createKeypair(): Keypair {
    return Keypair.generate();
  }

  /**
   * Create keypair from secret key
   * @param secretKey Secret key as Uint8Array or string
   * @returns Keypair from the secret key
   */
  importKeypair(secretKey: Uint8Array | string): Keypair {
    if (typeof secretKey === 'string') {
      // Convert from base58 or hex string
      if (secretKey.startsWith('0x')) {
        // Hex format
        secretKey = Buffer.from(secretKey.slice(2), 'hex');
      } else {
        // Assume base58
        secretKey = Buffer.from(secretKey, 'base58');
      }
    }

    return Keypair.fromSecretKey(secretKey);
  }

  /**
   * Airdrop SOL to an account (only works on devnet/testnet)
   * @param publicKey Target public key
   * @param amount Amount in SOL (not lamports)
   * @returns Transaction signature
   */
  async requestAirdrop(
    publicKey: string | PublicKey,
    amount: number = 1
  ): Promise<string> {
    const key = typeof publicKey === 'string' ? new PublicKey(publicKey) : publicKey;
    const lamports = amount * 1_000_000_000; // Convert SOL to lamports

    return this.connection.requestAirdrop(key, lamports);
  }
}

// Export a singleton instance with default configuration
export const solanaClient = new SolanaClient();
