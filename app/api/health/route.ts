import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';
import { EthereumClient } from '@/lib/ethereum';
import { BitcoinClient } from '@/lib/bitcoin';

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: { status: string; latency?: number };
    redis: { status: string; latency?: number };
  };
  blockchains: {
    bitcoin: { status: string; latency?: number; blockNumber?: number };
    ethereum: { status: string; latency?: number; blockNumber?: number };
  };
  uptime: number;
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const startTime = Date.now();
  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown' },
      redis: { status: 'unknown' },
    },
    blockchains: {
      bitcoin: { status: 'not_configured' },
      ethereum: { status: 'not_configured' },
    },
    uptime: process.uptime(),
  };

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    health.services.database = { status: 'error' };
    health.status = 'unhealthy';
  }

  try {
    const redisStart = Date.now();
    await redis.ping();
    health.services.redis = {
      status: 'healthy',
      latency: Date.now() - redisStart,
    };
  } catch (error) {
    health.services.redis = { status: 'error' };
    health.status = 'unhealthy';
  }

  if (process.env.ETHEREUM_RPC_URL) {
    try {
      const ethStart = Date.now();
      const ethClient = new EthereumClient(process.env.ETHEREUM_RPC_URL);
      const blockNum = await ethClient.getLatestBlockNumber();
      health.blockchains.ethereum = {
        status: 'healthy',
        latency: Date.now() - ethStart,
        blockNumber: blockNum,
      };
    } catch (error) {
      health.blockchains.ethereum = { status: 'error' };
    }
  }

  if (process.env.BITCOIN_RPC_URL) {
    try {
      const btcStart = Date.now();
      const btcClient = new BitcoinClient(
        process.env.BITCOIN_RPC_URL,
        process.env.BITCOIN_RPC_USER || 'bitcoinrpc',
        process.env.BITCOIN_RPC_PASSWORD || 'changeme123'
      );
      const blockCount = await btcClient.getBlockCount();
      health.blockchains.bitcoin = {
        status: 'healthy',
        latency: Date.now() - btcStart,
        blockNumber: blockCount,
      };
    } catch (error) {
      health.blockchains.bitcoin = { status: 'error' };
    }
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
  });
}
