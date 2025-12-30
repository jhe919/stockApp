"use client";

import { useEffect, useState } from "react";

// Types that match what /api/dev/holdings returns
type HoldingAccount = {
  id: number;
  name: string;
  broker: string;
  type: string;
};

type Holding = {
  id: number;
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  averageCost: number;
  marketPrice: number;
  marketValue: number;
  account: HoldingAccount;
};

type HoldingsResponse = {
  ok: boolean;
  user: {
    id: number;
    email: string;
  };
  totalValue: number;
  positions: Holding[];
};

export default function HoldingsPage() {
  const [data, setData] = useState<HoldingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Run once on mount to fetch holdings
  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        const res = await fetch("/api/dev/holdings");
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `Request failed with ${res.status}`);
        }

        const json = (await res.json()) as HoldingsResponse;
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, []); // empty deps array = run once when component mounts

  if (loading) {
    return <div className="p-6">Loading holdings...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Error loading holdings: {error}
      </div>
    );
  }

  if (!data || !data.ok) {
    return <div className="p-6">No holdings data. Did you run the seed?</div>;
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Demo Portfolio</h1>
      <p className="text-sm text-gray-600">
        User: <span className="font-mono">{data.user.email}</span>
      </p>
      <p className="text-lg font-medium">
        Total value: ${data.totalValue.toFixed(2)}
      </p>

      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="border-b px-3 py-2 text-left">Symbol</th>
            <th className="border-b px-3 py-2 text-left">Name</th>
            <th className="border-b px-3 py-2 text-left">Account</th>
            <th className="border-b px-3 py-2 text-right">Qty</th>
            <th className="border-b px-3 py-2 text-right">Avg Cost</th>
            <th className="border-b px-3 py-2 text-right">Price</th>
            <th className="border-b px-3 py-2 text-right">Market Value</th>
          </tr>
        </thead>
        <tbody>
          {data.positions.map((p) => (
            <tr key={p.id} className="odd:bg-white even:bg-gray-50">
              <td className="border-b px-3 py-2 font-mono">{p.symbol}</td>
              <td className="border-b px-3 py-2">{p.name}</td>
              <td className="border-b px-3 py-2">
                {p.account.broker} · {p.account.name}
              </td>
              <td className="border-b px-3 py-2 text-right">
                {p.quantity.toFixed(2)}
              </td>
              <td className="border-b px-3 py-2 text-right">
                ${p.averageCost.toFixed(2)}
              </td>
              <td className="border-b px-3 py-2 text-right">
                ${p.marketPrice.toFixed(2)}
              </td>
              <td className="border-b px-3 py-2 text-right">
                ${p.marketValue.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
