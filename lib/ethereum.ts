import { ethers, providers } from 'ethers';

export interface EthereumBlock {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  baseFeePerGas?: bigint;
  transactions: string[];
  nonce: string;
  extraData: string;
}

export interface EthereumTransaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: bigint;
  gasLimit: bigint;
  gasUsed?: bigint;
  nonce: number;
  input: string;
  v: number;
  r: string;
  s: string;
  status: number;
  timestamp: number;
  type: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  status: number;
  gasUsed: bigint;
  logs: Log[];
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
}

export class EthereumClient {
  private provider: providers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new providers.JsonRpcProvider(rpcUrl);
  }

  async getBlockByNumber(blockNumber: number): Promise<EthereumBlock | null> {
    const block = await this.provider.send('eth_getBlockByNumber', [
      ethers.utils.hexlify(blockNumber), 
      false
    ]);
    return this.parseBlock(block);
  }

  async getBlockByHash(blockHash: string): Promise<EthereumBlock | null> {
    const block = await this.provider.send('eth_getBlockByHash', [blockHash, false]);
    return this.parseBlock(block);
  }

  async getLatestBlockNumber(): Promise<number> {
    const blockNum = await this.provider.send('eth_blockNumber', []);
    return parseInt(blockNum, 16);
  }

  async getTransaction(txHash: string): Promise<EthereumTransaction | null> {
    const tx = await this.provider.send('eth_getTransactionByHash', [txHash]);
    if (!tx) return null;
    return {
      hash: tx.hash,
      blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : 0,
      blockHash: tx.blockHash || '',
      from: tx.from,
      to: tx.to || '',
      value: tx.value,
      gasPrice: BigInt(tx.gasPrice || 0),
      gasLimit: BigInt(tx.gas || 0),
      nonce: parseInt(tx.nonce, 16),
      input: tx.input,
      v: parseInt(tx.v, 16),
      r: tx.r,
      s: tx.s,
      type: tx.type ? parseInt(tx.type, 16) : 0,
      maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : undefined,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : undefined,
      timestamp: 0,
      status: 1,
    };
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    const receipt = await this.provider.send('eth_getTransactionReceipt', [txHash]);
    if (!receipt) return null;
    return {
      transactionHash: receipt.transactionHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      blockHash: receipt.blockHash,
      status: receipt.status === '0x1' ? 1 : 0,
      gasUsed: BigInt(receipt.gasUsed),
      logs: receipt.logs.map((log: any, idx: number) => ({
        address: log.address,
        topics: log.topics || [],
        data: log.data,
        logIndex: idx,
      })),
    };
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.send('eth_getBalance', [address, 'latest']);
    return balance;
  }

  async getCode(address: string): Promise<string> {
    return await this.provider.send('eth_getCode', [address, 'latest']);
  }

  async getNonce(address: string): Promise<number> {
    const nonce = await this.provider.send('eth_getTransactionCount', [address, 'latest']);
    return parseInt(nonce, 16);
  }

  private parseBlock(blockData: any): EthereumBlock | null {
    if (!blockData) return null;
    return {
      number: parseInt(blockData.number, 16),
      hash: blockData.hash,
      parentHash: blockData.parentHash,
      timestamp: parseInt(blockData.timestamp, 16),
      miner: blockData.miner,
      difficulty: BigInt(blockData.difficulty),
      gasLimit: BigInt(blockData.gasLimit),
      gasUsed: BigInt(blockData.gasUsed),
      baseFeePerGas: blockData.baseFeePerGas ? BigInt(blockData.baseFeePerGas) : undefined,
      transactions: blockData.transactions || [],
      nonce: blockData.nonce,
      extraData: blockData.extraData,
    };
  }
}