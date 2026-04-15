import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blockchain Explorer | Multi-Chain Indexer',
  description: 'A multi-chain blockchain transaction API with built-in security intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="logo">
              <div className="logo-icon">⬡</div>
              Block APIs
            </div>
            <nav className="nav">
              <a href="/dashboard" className="nav-link">Dashboard</a>
              <a href="/search" className="nav-link">Search</a>
              <a href="/dashboard/blocks" className="nav-link">Blocks</a>
              <a href="/dashboard/transactions" className="nav-link">Transactions</a>
              <a href="/dashboard/indexers" className="nav-link">Indexers</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}