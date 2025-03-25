/**
 * Wallet-based authentication for BioDaptor
 * Provides functionality for authentication using blockchain wallets
 */

import { PublicKey, Keypair } from '@solana/web3.js';
import { AuthenticationInput, UserSession } from '@shared/types';
import crypto from 'crypto';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import jwt from 'jsonwebtoken';

/**
 * Auth service configuration
 */
interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string | number;
  challengeExpiresIn: number; // milliseconds
}

/**
 * Default auth configuration
 */
const DEFAULT_CONFIG: AuthConfig = {
  jwtSecret: process.env.JWT_SECRET || 'biodaptor-development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  challengeExpiresIn: 5 * 60 * 1000, // 5 minutes
};

/**
 * Challenge message for authentication
 */
interface Challenge {
  message: string;
  timestamp: number;
  expires: number;
}

/**
 * Map of active challenges by wallet address
 */
const challenges = new Map<string, Challenge>();

/**
 * Wallet authentication service
 */
export class WalletAuth {
  private config: AuthConfig;

  /**
   * Create a new wallet authentication service
   * @param config Auth configuration
   */
  constructor(config: Partial<AuthConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a challenge message for wallet authentication
   * @param wallet Wallet address
   * @returns Challenge object with message and expiration
   */
  generateChallenge(wallet: string): Challenge {
    // Generate a random message
    const randomBytes = crypto.randomBytes(32);
    const message = `Sign this message to authenticate with BioDaptor: ${randomBytes.toString(
      'hex'
    )}`;

    const timestamp = Date.now();
    const expires = timestamp + this.config.challengeExpiresIn;

    // Store the challenge
    const challenge: Challenge = { message, timestamp, expires };
    challenges.set(wallet, challenge);

    return challenge;
  }

  /**
   * Verify a Solana wallet signature
   * @param publicKey Public key that signed the message
   * @param signature The signature to verify
   * @param message The message that was signed
   * @returns Whether the signature is valid
   */
  private verifySolanaSignature(
    publicKey: string,
    signature: string,
    message: string
  ): boolean {
    try {
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      const signatureBytes = bs58.decode(signature);
      const messageBytes = new TextEncoder().encode(message);

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );
    } catch (error) {
      console.error('Error verifying Solana signature:', error);
      return false;
    }
  }

  /**
   * Authenticate a user with a wallet signature
   * @param authInput Authentication input including wallet and signature
   * @returns User session if authentication succeeds, null otherwise
   */
  authenticate(authInput: AuthenticationInput): UserSession | null {
    const { wallet, signedMessage, message, timestamp } = authInput;

    // Get the stored challenge
    const challenge = challenges.get(wallet);

    // Verify the challenge exists and hasn't expired
    if (
      !challenge ||
      challenge.expires < Date.now() ||
      challenge.message !== message ||
      challenge.timestamp !== timestamp
    ) {
      return null;
    }

    // Verify the signature
    const isValid = this.verifySolanaSignature(
      wallet,
      signedMessage,
      message
    );

    if (!isValid) {
      return null;
    }

    // Clear the challenge
    challenges.delete(wallet);

    // Generate JWT token
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + (typeof this.config.jwtExpiresIn === 'string'
      ? parseInt(this.config.jwtExpiresIn.replace(/[^0-9]/g, '')) * 24 * 60 * 60
      : this.config.jwtExpiresIn);

    const token = jwt.sign(
      {
        wallet,
        issuedAt,
        expiresAt,
      },
      this.config.jwtSecret,
      {
        expiresIn: this.config.jwtExpiresIn,
      }
    );

    // Return user session
    return {
      userId: wallet, // Use wallet as user ID for now
      wallet,
      roles: ['dataProvider'], // Default role
      issuedAt,
      expiresAt,
      token,
    };
  }

  /**
   * Verify a JWT token
   * @param token JWT token to verify
   * @returns Decoded token payload if valid, null otherwise
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract user session from a JWT token
   * @param token JWT token
   * @returns User session if token is valid, null otherwise
   */
  getSessionFromToken(token: string): UserSession | null {
    const decoded = this.verifyToken(token);

    if (!decoded) {
      return null;
    }

    return {
      userId: decoded.wallet,
      wallet: decoded.wallet,
      roles: decoded.roles || ['dataProvider'],
      issuedAt: decoded.issuedAt,
      expiresAt: decoded.expiresAt,
      token,
    };
  }
}

// Export a singleton instance with default configuration
export const walletAuth = new WalletAuth();
