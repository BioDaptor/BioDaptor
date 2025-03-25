/**
 * BioDaptor Storage Example
 * Demonstrates how to use the IPFS storage adapter
 */

import getIPFSAdapter from '../adapters/storage';
import { IStorageAdapter, protocolRegistry, ProtocolType, ProtocolStatus, CompatibilityType } from '../core/protocol';

/**
 * Example of using the IPFS storage adapter
 */
async function storageDemo() {
  try {
    console.log('🧬 BioDaptor IPFS Storage Adapter Demo');
    console.log('--------------------------------------');

    // Register the IPFS protocol in the registry
    await registerIPFSProtocol();

    // Get the IPFS adapter instance
    console.log('\n📥 Initializing IPFS adapter...');
    const ipfsAdapter = await getIPFSAdapter();

    if (!ipfsAdapter) {
      throw new Error('Failed to get IPFS adapter');
    }

    // Cast to the storage adapter interface
    const storageAdapter = ipfsAdapter as IStorageAdapter;

    await storageAdapter.initialize({
      options: {
        gateway: 'https://ipfs.io/ipfs',
        encrypt: true
      }
    });

    console.log('✅ IPFS adapter initialized successfully');

    // Store some data
    console.log('\n📤 Storing genomic data on IPFS...');
    const genomicData = new TextEncoder().encode('ATCGATCGTAGCTAGCTAGCTGATCGATGTACGTAGCTAG');
    const cid = await storageAdapter.store(genomicData, {
      replicationFactor: 5
    });

    console.log(`✅ Data stored successfully with CID: ${cid}`);

    // Retrieve the data
    console.log('\n📥 Retrieving genomic data from IPFS...');
    const retrievedData = await storageAdapter.retrieve(cid);
    const decodedData = new TextDecoder().decode(retrievedData);

    console.log(`✅ Data retrieved successfully: ${decodedData}`);

    // Delete the data
    console.log('\n🗑️ Deleting genomic data from IPFS...');
    const deleted = await storageAdapter.delete(cid);

    if (deleted) {
      console.log('✅ Data deleted successfully');
    } else {
      console.log('❌ Failed to delete data');
    }

    console.log('\n🎉 IPFS Storage Adapter Demo Completed');

  } catch (error) {
    console.error('Error in IPFS storage demo:', error);
  }
}

/**
 * Register the IPFS protocol in the protocol registry
 */
async function registerIPFSProtocol() {
  try {
    // Check if protocol already exists
    const existingProtocol = await protocolRegistry.getProtocol('ipfs-storage');

    if (existingProtocol) {
      console.log('✅ IPFS protocol already registered');
      return;
    }

    console.log('\n📝 Registering IPFS protocol...');

    // Register the protocol
    const timestamp = Date.now();
    await protocolRegistry.registerProtocol({
      id: 'ipfs-storage',
      name: 'IPFS Storage',
      type: ProtocolType.STORAGE,
      description: 'InterPlanetary File System (IPFS) distributed storage protocol',
      creator: 'BioDaptor',
      maintainers: ['BioDaptor Team'],
      repository: 'https://github.com/ipfs/ipfs',
      documentation: 'https://docs.ipfs.io',
      license: 'MIT',
      tags: ['storage', 'ipfs', 'distributed', 'content-addressed'],
      currentVersion: '1.0.0',
      versions: {
        '1.0.0': {
          version: '1.0.0',
          releaseDate: timestamp,
          status: ProtocolStatus.ACTIVE,
          description: 'Initial IPFS storage adapter implementation',
          specificationUrl: 'https://ipfs.io/specs/',
          implementationUrl: 'https://github.com/ipfs/go-ipfs',
          changes: ['Initial release'],
          compatibility: {}
        }
      }
    });

    console.log('✅ IPFS protocol registered successfully');
  } catch (error) {
    console.error('Error registering IPFS protocol:', error);
    throw error;
  }
}

// Run the demo
storageDemo().catch(console.error);
