import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EthereumClient } from '@/lib/ethereum';
import { riskScoring } from '@/services/risk-scoring';

interface RouteParams {
  params: { txHash: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { txHash } = params;

  try {
    const ethNetwork = await prisma.network.findFirst({
      where: { name: { equals: 'ethereum', mode: 'insensitive' } },
    });

    if (!ethNetwork) {
      return NextResponse.json({ error: 'Ethereum network not configured' }, { status: 500 });
    }

    let tx = await prisma.transaction.findUnique({
      where: {
        networkId_txHash: {
          networkId: ethNetwork.id,
          txHash,
        },
      },
      include: {
        from: true,
        to: true,
        block: true,
        logs: true,
        riskScore: true,
      },
    });

    if (!tx && process.env.ETHEREUM_RPC_URL) {
      const ethClient = new EthereumClient(process.env.ETHEREUM_RPC_URL);
      const remoteTx = await ethClient.getTransaction(txHash);
      
      if (remoteTx) {
        return NextResponse.json({
          success: true,
          data: {
            txHash: remoteTx.hash,
            from: remoteTx.from,
            to: remoteTx.to,
            value: remoteTx.value,
            gasPrice: remoteTx.gasPrice.toString(),
            gasLimit: remoteTx.gasLimit.toString(),
            nonce: remoteTx.nonce,
            input: remoteTx.input,
            status: 'pending',
          },
          source: 'blockchain',
          timestamp: new Date().toISOString(),
        });
      }
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const riskScore = await riskScoring.getOrCreateRiskScore(
      txHash,
      tx.from?.address || '',
      tx.to?.address || '',
      tx.value,
      ethNetwork.id
    );

    return NextResponse.json({
      success: true,
      data: {
        ...tx,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice?.toString(),
        gasLimit: tx.gasLimit?.toString(),
        gasUsed: tx.gasUsed?.toString(),
        nonce: tx.nonce,
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        riskScore: {
          score: riskScore.overallScore,
          level: riskScore.riskLevel,
          flags: riskScore.flags,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
