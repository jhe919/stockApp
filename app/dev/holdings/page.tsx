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
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
        <div className="mx-auto max-w-5xl">Loading holdings...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
        <div className="mx-auto max-w-5xl text-red-400">
          Error loading holdings: {error}
        </div>
      </main>
    );
  }

  if (!data || !data.ok) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-6">
        <div className="mx-auto max-w-5xl">
          No holdings data. Did you run the seed?
        </div>
      </main>
    );
  }

  // --- Derived metrics for UI ---

  const totalValue = data.totalValue;

  const enrichedPositions = data.positions.map((p) => {
    const plDollar = (p.marketPrice - p.averageCost) * p.quantity;
    const plPercent =
      p.averageCost > 0
        ? ((p.marketPrice - p.averageCost) / p.averageCost) * 100
        : 0;
    const allocationPercent =
      totalValue > 0 ? (p.marketValue / totalValue) * 100 : 0;

    return {
      ...p,
      plDollar,
      plPercent,
      allocationPercent,
    };
  });

  const totalPositions = enrichedPositions.length;
  const bestByPL =
    enrichedPositions.length > 0
      ? [...enrichedPositions].sort((a, b) => b.plDollar - a.plDollar)[0]
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Demo Portfolio
            </h1>
            <p className="text-sm text-slate-300">
              User: <span className="font-mono">{data.user.email}</span>
            </p>
          </div>
        </header>

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total Value
            </p>
            <p className="mt-2 text-3xl font-semibold">
              ${totalValue.toFixed(2)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Positions
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {totalPositions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Top Position (by P/L)
            </p>
            {bestByPL ? (
              <div className="mt-2">
                <p className="text-sm font-medium text-slate-200">
                  {bestByPL.symbol} · {bestByPL.name}
                </p>
                <p
                  className={
                    "text-lg font-semibold " +
                    (bestByPL.plDollar >= 0
                      ? "text-emerald-400"
                      : "text-rose-400")
                  }
                >
                  {bestByPL.plDollar >= 0 ? "+" : "-"}$
                  {Math.abs(bestByPL.plDollar).toFixed(2)} (
                  {bestByPL.plPercent >= 0 ? "+" : "-"}
                  {Math.abs(bestByPL.plPercent).toFixed(2)}%)
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No positions
              </p>
            )}
          </div>
        </section>

        {/* Holdings table */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
          <h2 className="mb-3 text-base font-semibold text-slate-100">
            Holdings
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Symbol
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Name
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-300">
                    Account
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    Qty
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    Avg Cost
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    Price
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    Market Value
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    P/L ($)
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    P/L (%)
                  </th>
                  <th className="border-b border-slate-800 px-3 py-2 text-right text-xs font-semibold text-slate-300">
                    Allocation
                  </th>
                </tr>
              </thead>
              <tbody>
                {enrichedPositions.map((p) => (
                  <tr
                    key={p.id}
                    className="odd:bg-slate-900/40 even:bg-slate-800/40"
                  >
                    <td className="border-b border-slate-800 px-3 py-2 font-mono text-slate-100">
                      {p.symbol}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-slate-100">
                      {p.name}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-slate-200">
                      {p.account.broker} · {p.account.name}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-right">
                      {p.quantity.toFixed(2)}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-right">
                      ${p.averageCost.toFixed(2)}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-right">
                      ${p.marketPrice.toFixed(2)}
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-right">
                      ${p.marketValue.toFixed(2)}
                    </td>
                    <td
                      className={
                        "border-b border-slate-800 px-3 py-2 text-right font-medium " +
                        (p.plDollar >= 0
                          ? "text-emerald-400"
                          : "text-rose-400")
                      }
                    >
                      {p.plDollar >= 0 ? "+" : "-"}$
                      {Math.abs(p.plDollar).toFixed(2)}
                    </td>
                    <td
                      className={
                        "border-b border-slate-800 px-3 py-2 text-right font-medium " +
                        (p.plPercent >= 0
                          ? "text-emerald-400"
                          : "text-rose-400")
                      }
                    >
                      {p.plPercent >= 0 ? "+" : "-"}
                      {Math.abs(p.plPercent).toFixed(2)}%
                    </td>
                    <td className="border-b border-slate-800 px-3 py-2 text-right text-slate-200">
                      {p.allocationPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
