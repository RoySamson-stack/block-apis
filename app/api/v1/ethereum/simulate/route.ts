import { NextResponse } from 'next/server';
import { ethers, BigNumber } from 'ethers';

interface SimulateRequest {
  from: string;
  to: string;
  value?: string;
  gasLimit?: string;
  data?: string;
}

interface SimulationResult {
  success: boolean;
  gasUsed?: string;
  gasLimit?: string;
  revertReason?: string;
  logs?: any[];
  traces?: any[];
}

export async function POST(request: Request) {
  try {
    const body: SimulateRequest = await request.json();
    const { from, to, value, gasLimit, data } = body;

    if (!from || !to) {
      return NextResponse.json(
        { error: 'from and to addresses are required' },
        { status: 400 }
      );
    }

    if (!process.env.ETHEREUM_RPC_URL) {
      return NextResponse.json(
        { error: 'Ethereum RPC not configured' },
        { status: 500 }
      );
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    
    const tx = {
      from,
      to,
      value: value ? BigNumber.from(value) : BigNumber.from(0),
      gasLimit: gasLimit ? BigNumber.from(gasLimit) : BigNumber.from(21000),
      data: data || '0x',
    };

    try {
      const result = await provider.call(tx);
      
      const simulation: SimulationResult = {
        success: true,
        gasUsed: result,
      };

      return NextResponse.json({
        success: true,
        data: simulation,
        timestamp: new Date().toISOString(),
      });
    } catch (callError: any) {
      let revertReason = 'Unknown error';
      
      if (callError.message.includes(' reverted')) {
        const match = callError.message.match(/reason: (.*?),/);
        revertReason = match ? match[1] : callError.message.slice(0, 200);
      }

      return NextResponse.json({
        success: false,
        data: {
          success: false,
          revertReason,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
