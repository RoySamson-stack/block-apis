'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'auto' | 'tx' | 'address' | 'block'>('auto');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (searchType === 'tx') {
      router.push(`/dashboard/transactions?hash=${query}`);
    } else if (searchType === 'address') {
      router.push(`/dashboard/addresses?addr=${query}`);
    } else if (searchType === 'block') {
      router.push(`/dashboard/blocks?num=${query}`);
    } else {
      if (query.startsWith('0x') && query.length === 66) {
        router.push(`/dashboard/transactions?hash=${query}`);
      } else if (query.startsWith('0x') && query.length === 42) {
        router.push(`/dashboard/addresses?addr=${query}`);
      } else if (/^\d+$/.test(query)) {
        router.push(`/dashboard/blocks?num=${query}`);
      } else if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(query) || /^bc1[a-zA-HJ-NP-Z0-9]{25,90}$/.test(query)) {
        router.push(`/dashboard/addresses?addr=${query}`);
      } else {
        router.push(`/search?q=${query}`);
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
        Blockchain Explorer
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center' }}>
        Search transactions, addresses, and blocks across Bitcoin & Ethereum
      </p>

      <form onSubmit={handleSearch}>
        <div className="search" style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Enter transaction hash, address, or block number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <button
            type="button"
            className={`btn ${searchType === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchType('auto')}
          >
            Auto-detect
          </button>
          <button
            type="button"
            className={`btn ${searchType === 'tx' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchType('tx')}
          >
            Transaction
          </button>
          <button
            type="button"
            className={`btn ${searchType === 'address' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchType('address')}
          >
            Address
          </button>
          <button
            type="button"
            className={`btn ${searchType === 'block' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSearchType('block')}
          >
            Block
          </button>
        </div>
      </form>

      <div className="grid grid-3">
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⇩</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Ethereum</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Get transaction details, balances, and smart contract interactions
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>₿</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Bitcoin</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            View UTXO, inputs/outputs, and address clustering
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⟶</div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Cross-Chain</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Trace addresses across multiple blockchain networks
          </div>
        </div>
      </div>
    </div>
  );
}