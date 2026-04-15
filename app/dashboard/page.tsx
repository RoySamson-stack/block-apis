'use client';

import { useState, useEffect } from 'react';

interface Stats {
  indexedBlocks: number;
  indexedTransactions: number;
  indexedAddresses: number;
  networks: {
    name: string;
    chainId?: number;
    lastBlock: string;
    status: string;
  }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    indexedBlocks: 0,
    indexedTransactions: 0,
    indexedAddresses: 0,
    networks: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setStats({
        indexedBlocks: 12500,
        indexedTransactions: 45000,
        indexedAddresses: 15000,
        networks: [
          { name: 'Ethereum', chainId: 1, lastBlock: '21,500,000', status: data.blockchains?.ethereum || 'connected' },
          { name: 'Bitcoin', chainId: 0, lastBlock: '875,000', status: data.blockchains?.bitcoin || 'connected' },
        ],
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="search">
        <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input type="text" className="search-input" placeholder="Search by transaction hash, address, or block..." />
      </div>

      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Blocks</div>
          <div className="stat-value">{stats.indexedBlocks.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value">{stats.indexedTransactions.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Addresses</div>
          <div className="stat-value">{stats.indexedAddresses.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Networks</div>
          <div className="stat-value">{stats.networks.length}</div>
        </div>
      </div>

      <div className="section-title">Network Status</div>
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        {stats.networks.map((network) => (
          <div key={network.name} className="card">
            <div className="card-header">
              <div className="card-title">{network.name}</div>
              <span className={`badge ${network.status === 'connected' ? 'badge-success' : 'badge-warning'}`}>
                {network.status}
              </span>
            </div>
            <div className="card-value" style={{ fontSize: '1.25rem' }}>
              Block #{network.lastBlock}
            </div>
            {network.chainId !== undefined && (
              <div className="stat-network">
                <span className={`network-dot ${network.name.toLowerCase()}`}></span>
                Chain ID: {network.chainId}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="section-title">Recent Blocks</div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Block</th>
              <th>Network</th>
              <th>Hash</th>
              <th>Transactions</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>21,500,000</td>
              <td>Ethereum</td>
              <td className="hash">0x1a2b3c...</td>
              <td>145</td>
              <td>2 min ago</td>
            </tr>
            <tr>
              <td>874,999</td>
              <td>Bitcoin</td>
              <td className="hash">0xdef456...</td>
              <td>2,341</td>
              <td>5 min ago</td>
            </tr>
            <tr>
              <td>21,499,999</td>
              <td>Ethereum</td>
              <td className="hash">0x789abc...</td>
              <td>128</td>
              <td>12 sec ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}