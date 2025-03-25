# BioDaptor

A decentralized genomic data platform that leverages blockchain technology, IPFS, and privacy-preserving protocols.

## Project Overview

BioDaptor is a protocol layer for genomics data that enables secure, privacy-preserving, and value-accruing interactions with genomic datasets. The platform integrates several core protocols:

1. **Storage Protocol**: Decentralized storage adapters for IPFS, Filecoin, Arweave
2. **Computation Protocol**: Secure compute environments for genomic analysis
3. **Privacy Protocol**: Privacy-preserving algorithms and federated learning
4. **Consensus Protocol**: Mechanisms for reaching agreement on data sharing
5. **Distribution Protocol**: Value distribution mechanisms for data providers
6. **Data Format Protocol**: Standards for genomic data representation
7. **Identity Protocol**: Secure identity verification systems

## Project Structure

```
/
├── adapters/                 # Protocol adapter implementations
│   └── storage/
│       ├── index.ts
│       └── ipfs-adapter.ts   # IPFS storage adapter
├── core/                     # Core protocol interfaces
│   ├── auth/                 # Authentication and access control
│   ├── data/                 # Genomic data structures and indexing
│   ├── privacy/              # Privacy-preserving technologies
│   ├── protocol/             # Protocol registry and adapter factory
│   ├── settings/             # System-wide configuration services
│   ├── value/                # Value distribution mechanism
│   └── index.ts
├── examples/                 # Example implementations
│   └── storage-example.ts    # Storage adapter usage example
├── infrastructure/           # Implementation infrastructure
│   ├── blockchain/           # Blockchain connectivity
│   └── ipfs/                 # IPFS integration
└── standalone-storage-example.js  # Standalone example without TypeScript dependencies
```

## IPFS Storage Adapter

The IPFS Storage Adapter implements the Storage Protocol, enabling secure storage of genomic data on IPFS. It features:

- Decentralized storage on IPFS network
- Optional data encryption
- Configurable replication factors
- Integration with the BioDaptor protocol system

### Usage Example

```javascript
import { protocolRegistry, ProtocolType, ProtocolStatus } from '@core/protocol';
import getIPFSAdapter from '@adapters/storage';

async function storeGenomicData() {
  // Register the IPFS protocol if not already registered
  await registerIPFSProtocol();

  // Get the IPFS adapter
  const ipfsAdapter = await getIPFSAdapter();

  // Initialize with options
  await ipfsAdapter.initialize({
    options: {
      gateway: 'https://ipfs.io/ipfs',
      encrypt: true
    }
  });

  // Store genomic data
  const genomicData = new TextEncoder().encode('ATCG...');
  const cid = await ipfsAdapter.store(genomicData);

  console.log(`Data stored with CID: ${cid}`);

  // Retrieve the data
  const retrievedData = await ipfsAdapter.retrieve(cid);

  // Delete when no longer needed
  await ipfsAdapter.delete(cid);
}
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the storage example:
   ```
   node standalone-storage-example.js
   ```

## Future Development

- Complete implementation of all protocol adapters
- Develop integration with real IPFS nodes
- Implement privacy-preserving genomic computation
- Create blockchain-based value distribution system
- Develop federated learning system for genomic data

## License

MIT
