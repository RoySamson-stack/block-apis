import { prisma } from '@/lib/db';

export interface RiskFactor {
  name: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface RiskAssessment {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  flags: string[];
}

export class RiskScoringService {
  
  private async getAddressRisk(address: string, networkId: string): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];
    
    const addr = await prisma.address.findUnique({
      where: {
        networkId_address: { networkId, address },
      },
      include: { tags: true },
    });
    
    if (!addr) {
      factors.push({
        name: 'unknown_address',
        score: 0,
        severity: 'low',
        description: 'Address not seen before on this network',
      });
      return factors;
    }
    
    if (addr.tags.some(t => t.tag.toLowerCase().includes('exchange'))) {
      factors.push({
        name: 'exchange_address',
        score: -10,
        severity: 'low',
        description: 'Known exchange address',
      });
    }
    
    if (addr.tags.some(t => t.tag.toLowerCase().includes('mixer'))) {
      factors.push({
        name: 'mixer_address',
        score: 40,
        severity: 'critical',
        description: 'Associated with cryptocurrency mixer',
      });
    }
    
    if (addr.tags.some(t => t.tag.toLowerCase().includes('hack'))) {
      factors.push({
        name: 'hacked_address',
        score: 50,
        severity: 'critical',
        description: 'Associated with known hack/theft',
      });
    }
    
    return factors;
  }
  
  private async getTransactionRisk(
    txHash: string, 
    from: string, 
    to: string, 
    value: string,
    networkId: string
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = [];
    
    const fromFactors = await this.getAddressRisk(from, networkId);
    const toFactors = await this.getAddressRisk(to, networkId);
    
    factors.push(...fromFactors, ...toFactors);
    
    const valueNum = parseFloat(value) / 1e18;
    if (valueNum > 10000) {
      factors.push({
        name: 'high_value',
        score: 20,
        severity: 'high',
        description: `Large transaction: ${valueNum.toFixed(2)} ETH`,
      });
    }
    
    if (valueNum === 0 && to !== '0x0000000000000000000000000000000000000000') {
      factors.push({
        name: 'zero_value',
        score: 10,
        severity: 'medium',
        description: 'Zero value transfer - potential token interaction',
      });
    }
    
    return factors;
  }
  
  async assessTransaction(
    txHash: string,
    from: string,
    to: string,
    value: string,
    networkId: string
  ): Promise<RiskAssessment> {
    const factors = await this.getTransactionRisk(txHash, from, to, value, networkId);
    
    const baseScore = factors.reduce((sum, f) => sum + f.score, 0);
    const overallScore = Math.max(0, Math.min(100, 50 + baseScore));
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (overallScore >= 75) riskLevel = 'CRITICAL';
    else if (overallScore >= 50) riskLevel = 'HIGH';
    else if (overallScore >= 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';
    
    const flags = factors
      .filter(f => f.severity === 'high' || f.severity === 'critical')
      .map(f => f.name);
    
    return { overallScore, riskLevel, factors, flags };
  }
  
  async getOrCreateRiskScore(
    txHash: string,
    from: string,
    to: string,
    value: string,
    networkId: string
  ) {
    const existing = await prisma.riskScore.findUnique({
      where: { transactionId: txHash },
    });
    
    if (existing) return existing;
    
    const assessment = await this.assessTransaction(txHash, from, to, value, networkId);
    
    return await prisma.riskScore.create({
      data: {
        transactionId: txHash,
        overallScore: assessment.overallScore,
        riskLevel: assessment.riskLevel,
        factors: assessment.factors as any,
        flags: assessment.flags,
      },
    });
  }
}

export const riskScoring = new RiskScoringService();
