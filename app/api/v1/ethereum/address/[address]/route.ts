import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: { address: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { address } = params;

  try {
    const ethNetwork = await prisma.network.findFirst({
      where: { name: { equals: 'ethereum', mode: 'insensitive' } },
    });

    if (!ethNetwork) {
      return NextResponse.json({ error: 'Ethereum network not configured' }, { status: 500 });
    }

    const addr = await prisma.address.findUnique({
      where: {
        networkId_address: {
          networkId: ethNetwork.id,
          address: address.toLowerCase(),
        },
      },
      include: {
        tags: true,
        txFrom: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
        txTo: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!addr) {
      return NextResponse.json({
        success: true,
        data: {
          address: address.toLowerCase(),
          balance: '0',
          nonce: 0,
          isContract: false,
          transactions: { sent: [], received: [] },
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...addr,
        balance: addr.balance.toString(),
        nonce: addr.nonce.toString(),
        transactions: {
          sent: addr.txFrom,
          received: addr.txTo,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}