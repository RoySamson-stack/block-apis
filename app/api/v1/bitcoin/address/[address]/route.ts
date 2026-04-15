import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: { address: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { address } = params;

  try {
    const btcNetwork = await prisma.network.findFirst({
      where: { name: { equals: 'bitcoin', mode: 'insensitive' } },
    });

    if (!btcNetwork) {
      return NextResponse.json({ error: 'Bitcoin network not configured' }, { status: 500 });
    }

    const addr = await prisma.address.findUnique({
      where: {
        networkId_address: {
          networkId: btcNetwork.id,
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