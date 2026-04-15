import { PrismaClient, Network, Block, Transaction, Address, IndexerStatus } from '@prisma/client';
import { EthereumClient } from '../lib/ethereum';
import { BitcoinClient } from '../lib/bitcoin';

export interface IndexerConfig {
  networkId: string;
  rpcUrl: string;
  wsUrl?: string;
  rpcUser?: string;
  rpcPassword?: string;
  chain: 'ethereum' | 'bitcoin';
  confirmations?: number;
}

export interface IndexerStats {
  currentBlock: bigint;
  indexedBlocks: number;
  indexedTransactions: number;
  indexedAddresses: number;
  lastIndexedAt: Date;
  status: IndexerStatus;
  errorMessage?: string;
}

export class IndexerService {
  private prisma: PrismaClient;
  private config: IndexerConfig;
  private ethClient?: EthereumClient;
  private btcClient?: BitcoinClient;
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;
  private startBlock: number = 0;

  constructor(config: IndexerConfig) {
    this.prisma = new PrismaClient();
    this.config = config;
    
    if (config.chain === 'ethereum') {
      this.ethClient = new EthereumClient(config.rpcUrl);
    } else if (config.chain === 'bitcoin') {
      this.btcClient = new BitcoinClient(
        config.rpcUrl,
        config.rpcUser || 'bitcoinrpc',
        config.rpcPassword || 'changeme123'
      );
    }
  }

  async start(fromBlock?: number): Promise<void> {
    if (this.isRunning) {
      console.log(`Indexer for ${this.config.networkId} already running`);
      return;
    }

    console.log(`Starting indexer for ${this.config.networkId} at block ${fromBlock || 'latest'}`);
    this.isRunning = true;
    this.startBlock = fromBlock || await this.getLatestBlock();

    await this.updateIndexerState(IndexerStatus.RUNNING);
    
    this.intervalId = setInterval(() => this.sync_once(), 15000);
    await this.sync_once();
  }

  async stop(): Promise<void> {
    console.log(`Stopping indexer for ${this.config.networkId}`);
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    await this.updateIndexerState(IndexerStatus.STOPPED);
  }

  private async sync_once(): Promise<void> {
    try {
      if (this.config.chain === 'ethereum') {
        await this.syncEthereum();
      } else if (this.config.chain === 'bitcoin') {
        await this.syncBitcoin();
      }
    } catch (error: any) {
      console.error(`Indexing error for ${this.config.networkId}:`, error.message);
      await this.updateIndexerState(IndexerStatus.ERROR, error.message);
    }
  }

  private async syncEthereum(): Promise<void> {
    if (!this.ethClient) return;

    const latestBlock = await this.ethClient.getLatestBlockNumber();
    const indexerState = await this.getIndexerState();
    const currentBlock = Number(indexerState?.lastBlockNumber || BigInt(this.startBlock));

    console.log(`Syncing Ethereum: ${currentBlock} -> ${latestBlock}`);

    for (let blockNum = currentBlock; blockNum <= latestBlock; blockNum++) {
      const block = await this.ethClient.getBlockByNumber(blockNum);
      if (!block) continue;

      await this.indexEthereumBlock(block.number, block);

      for (const txHash of block.transactions) {
        await this.indexEthereumTransaction(txHash, block.number);
      }
    }
  }

  private async syncBitcoin(): Promise<void> {
    if (!this.btcClient) return;

    const latestBlock = await this.btcClient.getBlockCount();
    const indexerState = await this.getIndexerState();
    const currentBlock = Number(indexerState?.lastBlockNumber || BigInt(this.startBlock));

    console.log(`Syncing Bitcoin: ${currentBlock} -> ${latestBlock}`);

    for (let blockNum = currentBlock; blockNum <= latestBlock; blockNum++) {
      const blockHash = await this.btcClient.getBlockHash(blockNum);
      const block = await this.btcClient.getBlock(blockHash, 1) as any;
      if (!block) continue;

      await this.indexBitcoinBlock(blockNum, block);

      for (const txHash of block.tx) {
        await this.indexBitcoinTransaction(txHash);
      }
    }
  }

  private async indexEthereumBlock(blockNumber: number, block: any): Promise<void> {
    const timestamp = new Date(block.timestamp * 1000);
    
    await this.prisma.block.upsert({
      where: {
        networkId_blockNumber: {
          networkId: this.config.networkId,
          blockNumber: BigInt(blockNumber),
        },
      },
      create: {
        networkId: this.config.networkId,
        blockNumber: BigInt(blockNumber),
        blockHash: block.hash,
        parentHash: block.parentHash,
        timestamp,
        miner: block.miner,
        difficulty: BigInt(block.difficulty),
        gasLimit: BigInt(block.gasLimit),
        gasUsed: BigInt(block.gasUsed),
        transactionCount: block.transactions?.length || 0,
        size: block.size,
        nonce: block.nonce,
        extraData: block.extraData,
        baseFeePerGas: block.baseFeePerGas ? BigInt(block.baseFeePerGas) : null,
      },
      update: {
        blockHash: block.hash,
        miner: block.miner,
        gasUsed: BigInt(block.gasUsed),
        transactionCount: block.transactions?.length || 0,
      },
    });
  }

  private async indexEthereumTransaction(txHash: string, blockNumber: number): Promise<void> {
    try {
      const tx = await this.ethClient?.getTransaction(txHash);
      const receipt = await this.ethClient?.getTransactionReceipt(txHash);
      
      if (!tx) return;

      const fromAddress = await this.getOrCreateAddress(tx.from, 'ethereum');
      const toAddress = tx.to ? await this.getOrCreateAddress(tx.to, 'ethereum') : null;

      await this.prisma.transaction.upsert({
        where: {
          networkId_txHash: {
            networkId: this.config.networkId,
            txHash,
          },
        },
        create: {
          networkId: this.config.networkId,
          txHash,
          blockNumber: BigInt(blockNumber),
          fromId: fromAddress?.id,
          toId: toAddress?.id,
          value: tx.value,
          gasPrice: BigInt(tx.gasPrice),
          gasLimit: BigInt(tx.gasLimit),
          gasUsed: receipt?.gasUsed ? BigInt(receipt.gasUsed) : null,
          nonce: tx.nonce,
          input: tx.input,
          v: String(tx.v),
          r: tx.r,
          s: tx.s,
          status: receipt?.status === 1,
          timestamp: new Date(),
          type: tx.type,
          maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : null,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : null,
        },
        update: {
          status: receipt?.status === 1,
          gasUsed: receipt?.gasUsed ? BigInt(receipt.gasUsed) : null,
        },
      });

      if (receipt?.logs) {
        for (const log of receipt.logs) {
          await this.prisma.transactionLog.upsert({
            where: {
              transactionId_logIndex: {
                transactionId: txHash,
                logIndex: log.logIndex,
              },
            },
            create: {
              transactionId: txHash,
              logIndex: log.logIndex,
              address: log.address,
              topic0: log.topics[0],
              topic1: log.topics[1],
              topic2: log.topics[2],
              topic3: log.topics[3],
              data: log.data,
            },
            update: {},
          });
        }
      }
    } catch (error: any) {
      console.error(`Error indexing tx ${txHash}:`, error.message);
    }
  }

  private async indexBitcoinBlock(blockNumber: number, block: any): Promise<void> {
    await this.prisma.block.upsert({
      where: {
        networkId_blockNumber: {
          networkId: this.config.networkId,
          blockNumber: BigInt(blockNumber),
        },
      },
      create: {
        networkId: this.config.networkId,
        blockNumber: BigInt(blockNumber),
        blockHash: block.hash,
        timestamp: new Date(block.time * 1000),
        transactionCount: block.tx?.length || 0,
        size: block.size,
        nonce: block.nonce,
      },
      update: {
        blockHash: block.hash,
        transactionCount: block.tx?.length || 0,
      },
    });
  }

  private async indexBitcoinTransaction(txHash: string): Promise<void> {
    try {
      const tx = await this.btcClient?.getTransaction(txHash);
      if (!tx) return;

      for (const vin of tx.vin) {
        if (vin.address) {
          await this.getOrCreateAddress(vin.address, 'bitcoin');
        }
      }

      for (const vout of tx.vout) {
        if (vout.scriptPubKey.addresses?.length) {
          await this.getOrCreateAddress(vout.scriptPubKey.addresses[0], 'bitcoin');
        }
      }
    } catch (error: any) {
      console.error(`Error indexing BTC tx ${txHash}:`, error.message);
    }
  }

  private async getOrCreateAddress(address: string, chain: string): Promise<Address | null> {
    if (!address) return null;
    
    const network = await this.prisma.network.findFirst({
      where: { name: { equals: chain, mode: 'insensitive' } },
    });
    
    if (!network) return null;

    return await this.prisma.address.upsert({
      where: {
        networkId_address: {
          networkId: network.id,
          address: address.toLowerCase(),
        },
      },
      create: {
        networkId: network.id,
        address: address.toLowerCase(),
      },
      update: {},
    });
  }

  private async getLatestBlock(): Promise<number> {
    if (this.config.chain === 'ethereum') {
      return await this.ethClient!.getLatestBlockNumber();
    } else if (this.config.chain === 'bitcoin') {
      return await this.btcClient!.getBlockCount();
    }
    return 0;
  }

  private async getIndexerState(): Promise<any> {
    return await this.prisma.indexerState.findUnique({
      where: { networkId: this.config.networkId },
    });
  }

  private async updateIndexerState(status: IndexerStatus, error?: string): Promise<void> {
    const currentBlock = await this.getLatestBlock();
    
    await this.prisma.indexerState.upsert({
      where: { networkId: this.config.networkId },
      create: {
        networkId: this.config.networkId,
        lastBlockNumber: BigInt(currentBlock),
        status,
        errorMessage: error,
      },
      update: {
        lastBlockNumber: BigInt(currentBlock),
        status,
        errorMessage: error,
        lastIndexedAt: new Date(),
      },
    });
  }

  async getStats(): Promise<IndexerStats> {
    const indexerState = await this.getIndexerState();
    const blockCount = await this.prisma.block.count({
      where: { networkId: this.config.networkId },
    });
    const txCount = await this.prisma.transaction.count({
      where: { networkId: this.config.networkId },
    });
    const addrCount = await this.prisma.address.count({
      where: { networkId: this.config.networkId },
    });

    return {
      currentBlock: indexerState?.lastBlockNumber || BigInt(0),
      indexedBlocks: blockCount,
      indexedTransactions: txCount,
      indexedAddresses: addrCount,
      lastIndexedAt: indexerState?.lastIndexedAt || new Date(),
      status: indexerState?.status || IndexerStatus.STOPPED,
      errorMessage: indexerState?.errorMessage,
    };
  }
}