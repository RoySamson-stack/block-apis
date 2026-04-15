import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
  }

  try {
    const networks = await prisma.network.findMany({
      where: { isActive: true },
    });

    const results = [];

    for (const network of networks) {
      const addr = await prisma.address.findUnique({
        where: {
          networkId_address: {
            networkId: network.id,
            address: address.toLowerCase(),
          },
        },
        include: {
          txFrom: { take: 5, orderBy: { timestamp: 'desc' } },
          txTo: { take: 5, orderBy: { timestamp: 'desc' } },
        },
      });

      if (addr) {
        results.push({
          network: network.name,
          chainId: network.chainId,
          address: addr.address,
          balance: addr.balance.toString(),
          isContract: addr.isContract,
          firstSeen: addr.firstSeen,
          transactions: {
            sent: addr.txFrom.length,
            received: addr.txTo.length,
          },
        });
      } else {
        results.push({
          network: network.name,
          chainId: network.chainId,
          address: address.toLowerCase(),
          found: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        queryAddress: address.toLowerCase(),
        networks: results,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}