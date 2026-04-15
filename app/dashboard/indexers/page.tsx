'use client';

import { useState, useEffect } from 'react';

interface Indexer {
  id: string;
  networkId: string;
  networkName: string;
  lastBlockNumber: string;
  lastIndexedAt: string;
  status: string;
}

export default function IndexersPage() {
  const [indexers, setIndexers] = useState<Indexer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/health')
      .then(res => res.json())
      .then(() => {
        setIndexers([
          {
            id: '1',
            networkId: 'eth-mainnet',
            networkName: 'Ethereum',
            lastBlockNumber: '21500000',
            lastIndexedAt: new Date().toISOString(),
            status: 'RUNNING',
          },
          {
            id: '2',
            networkId: 'btc-mainnet',
            networkName: 'Bitcoin',
            lastBlockNumber: '875000',
            lastIndexedAt: new Date().toISOString(),
            status: 'RUNNING',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleIndexer = async (id: string, action: 'pause' | 'resume' | 'stop') => {
    console.log(`${action} indexer ${id}`);
  };

  return (
    <div>
      <div className="section-title">Indexers</div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Manage blockchain indexers. Each indexer syncs blocks and transactions from a blockchain network.
      </p>

      <div className="grid grid-2">
        {indexers.map((indexer) => (
          <div key={indexer.id} className="card">
            <div className="card-header">
              <div className="card-title">{indexer.networkName}</div>
              <span className={`badge ${indexer.status === 'RUNNING' ? 'badge-success' : indexer.status === 'PAUSED' ? 'badge-warning' : 'badge-error'}`}>
                {indexer.status}
              </span>
            </div>
            
            <div className="tx-details" style={{ marginBottom: '1rem' }}>
              <div className="tx-detail">
                <span className="tx-label">Network ID</span>
                <span className="tx-value">{indexer.networkId}</span>
              </div>
              <div className="tx-detail">
                <span className="tx-label">Current Block</span>
                <span className="tx-value">#{parseInt(indexer.lastBlockNumber).toLocaleString()}</span>
              </div>
              <div className="tx-detail">
                <span className="tx-label">Last Indexed</span>
                <span className="tx-value">{new Date(indexer.lastIndexedAt).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {indexer.status === 'RUNNING' ? (
                <button className="btn btn-secondary" onClick={() => toggleIndexer(indexer.id, 'pause')}>
                  Pause
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => toggleIndexer(indexer.id, 'resume')}>
                  Resume
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => toggleIndexer(indexer.id, 'stop')} style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
                Stop
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: '2rem' }}>Add New Indexer</div>
      <div className="card">
        <div className="grid grid-3">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Network</label>
            <select className="search-input" style={{ padding: '0.75rem' }}>
              <option value="">Select network...</option>
              <option value="ethereum">Ethereum</option>
              <option value="bitcoin">Bitcoin</option>
              <option value="polygon">Polygon</option>
              <option value="bsc">BNB Smart Chain</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>RPC URL</label>
            <input type="text" className="search-input" placeholder="https://..." style={{ padding: '0.75rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Start Block</label>
            <input type="number" className="search-input" placeholder="0 (latest)" style={{ padding: '0.75rem' }} />
          </div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Start Indexer
        </button>
      </div>
    </div>
  );
}