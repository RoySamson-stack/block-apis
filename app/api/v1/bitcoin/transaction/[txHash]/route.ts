import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: { txHash: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { txHash } = params;

  try {
    const btcNetwork = await prisma.network.findFirst({
      where: { name: { equals: 'bitcoin', mode: 'insensitive' } },
    });

    if (!btcNetwork) {
      return NextResponse.json({ error: 'Bitcoin network not configured' }, { status: 500 });
    }

    const tx = await prisma.transaction.findUnique({
      where: {
        networkId_txHash: {
          networkId: btcNetwork.id,
          txHash,
        },
      },
      include: {
        from: true,
        to: true,
        block: true,
      },
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tx,
        value: tx.value.toString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}