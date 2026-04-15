import axios from 'axios';

export interface BitcoinBlock {
  hash: string;
  confirmations: number;
  strippedsize: number;
  size: number;
  weight: number;
  version: number;
  versionHex: string;
  merkleroot: string;
  tx: string[];
  nonce: string;
  bits: string;
  difficulty: string;
  chainwork: string;
  previousblockhash: string;
  nextblockhash?: string;
  mediantime: number;
  time: number;
  numTxes: number;
}

export interface BitcoinTransaction {
  txid: string;
  hash: string;
  version: number;
  size: number;
  vsize: number;
  weight: number;
  locktime: number;
  vin: BitcoinVin[];
  vout: BitcoinVout[];
  hex: string;
  blockhash?: string;
  blocktime?: number;
  time?: number;
  confirmations?: number;
}

export interface BitcoinVin {
  txid?: string;
  vout?: number;
  scriptSig: {
    asm: string;
    hex: string;
  };
  sequence: number;
  address?: string;
  value?: string;
  witness?: string[];
}

export interface BitcoinVout {
  value: number;
  n: number;
  scriptPubKey: {
    asm: string;
    hex: string;
    reqSigs: number;
    type: string;
    addresses?: string[];
  };
}

export class BitcoinClient {
  private rpcUrl: string;
  private rpcUser: string;
  private rpcPassword: string;

  constructor(rpcUrl: string, rpcUser: string, rpcPassword: string) {
    this.rpcUrl = rpcUrl;
    this.rpcUser = rpcUser;
    this.rpcPassword = rpcPassword;
  }

  private async rpcCall(method: string, params: any[] = []): Promise<any> {
    const auth = Buffer.from(`${this.rpcUser}:${this.rpcPassword}`).toString('base64');
    const response = await axios.post(this.rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.data.error) {
      throw new Error(response.data.error.message);
    }
    return response.data.result;
  }

  async getBestBlockHash(): Promise<string> {
    return await this.rpcCall('getbestblockhash', []);
  }

  async getBlock(blockHash: string, verbosity: number = 1): Promise<BitcoinBlock | string[]> {
    return await this.rpcCall('getblock', [blockHash, verbosity]);
  }

  async getBlockByHeight(blockHeight: number, verbosity: number = 1): Promise<BitcoinBlock | string[]> {
    const blockHash = await this.rpcCall('getblockhash', [blockHeight]);
    return await this.getBlock(blockHash, verbosity);
  }

  async getTransaction(txHash: string, verbosity: number = 1): Promise<BitcoinTransaction> {
    return await this.rpcCall('getrawtransaction', [txHash, verbosity]);
  }

  async getBlockCount(): Promise<number> {
    return await this.rpcCall('getblockcount', []);
  }

  async getBlockHash(blockHeight: number): Promise<string> {
    return await this.rpcCall('getblockhash', [blockHeight]);
  }

  async getMempool(): Promise<string[]> {
    return await this.rpcCall('getrawmempool', []);
  }

  async sendRawTransaction(hex: string): Promise<string> {
    return await this.rpcCall('sendrawtransaction', [hex]);
  }

  async decodeRawTransaction(hex: string): Promise<Partial<BitcoinTransaction>> {
    return await this.rpcCall('decoderawtransaction', [hex]);
  }

  async estimateSmartFee(blocks: number = 6): Promise<{ feerate: number; blocks: number }> {
    return await this.rpcCall('estimatesmartfee', [blocks]);
  }

  async getNetworkInfo(): Promise<any> {
    return await this.rpcCall('getnetworkinfo', []);
  }

  async getBlockchainInfo(): Promise<any> {
    return await this.rpcCall('getblockchaininfo', []);
  }

  async getTxOut(txHash: string, vout: number, includeMempool: boolean = true): Promise<{
    bestblock: string;
    confirmations: number;
    value: number;
    scriptPubKey: {
      asm: string;
      hex: string;
      reqSigs: number;
      type: string;
      addresses?: string[];
    };
    coinbase: boolean;
  } | null> {
    return await this.rpcCall('gettxout', [txHash, vout, includeMempool]);
  }

  async listUnspent(address: string, minConf: number = 0, maxConf: number = 9999999): Promise<{
    txid: string;
    vout: number;
    address: string;
    amount: number;
    confirmations: number;
    scriptPubKey: {
      hex: string;
    };
  }[]> {
    return await this.rpcCall('listunspent', [minConf, maxConf, [address]]);
  }

  isValidAddress(address: string): boolean {
    const validMain = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const validBc1 = /^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/;
    return validMain.test(address) || validBc1.test(address);
  }
}