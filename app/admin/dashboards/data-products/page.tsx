import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Package, ShoppingBag, DollarSign, Clock, AlertTriangle, Globe } from "lucide-react";
import { getDataProductsDashboardReadModel } from "@/lib/admin/data-products/read-model";

export const metadata: Metadata = {
  title: "Data Products Dashboard - Haul Command Admin",
  description: "Supabase-backed data product purchase, fulfillment, and revenue readiness dashboard.",
};

export const dynamic = "force-dynamic";

function money(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function card(label: string, value: string, sub: string, color: string) {
  return (
    <div style={{ padding: 18, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", color, marginBottom: 8 }}>
        <DollarSign size={15} />
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      </div>
      <div style={{ color: "#fff", fontSize: 27, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "#8a93a3", fontSize: 11, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default async function DataProductsDashboard() {
  const model = await getDataProductsDashboardReadModel();

  return (
    <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto", color: "#fff" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Data Products</h1>
          <p style={{ margin: "6px 0 0", color: "#8a93a3", fontSize: 12 }}>
            Real purchase telemetry from <code>data_purchases</code>. Revenue is catalog-derived for active purchases only.
          </p>
        </div>
        <div style={{ textAlign: "right", color: "#8a93a3", fontSize: 11 }}>
          <div>Updated {new Date(model.asOf).toLocaleString()}</div>
          <div>Source: {model.source.table}</div>
        </div>
      </header>

      {model.error && (
        <section style={{ display: "flex", gap: 10, alignItems: "center", padding: 14, borderRadius: 10, border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)", color: "#F59E0B", marginBottom: 18 }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Live purchase data unavailable.</strong>
            <span style={{ marginLeft: 6, color: "#f8c471" }}>{model.error}</span>
          </div>
        </section>
      )}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
        {card("Estimated Active Revenue", money(model.estimatedActiveRevenueUsd), "Catalog price x active purchases", "#22C55E")}
        {card("Estimated MRR", money(model.estimatedMrrUsd), "Subscription products with active purchases", "#3B82F6")}
        {card("Purchase Records", model.purchaseCount.toLocaleString(), `${model.activePurchaseCount} active, ${model.pendingPurchaseCount} pending`, "#C6923A")}
        {card("Fulfillment Queue", model.fulfillmentRequiredCount.toLocaleString(), "Metadata says fulfillment is required/pending", "#F59E0B")}
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18, background: "rgba(255,255,255,0.025)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 850, margin: "0 0 14px" }}>Active Revenue by Month</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {model.monthlyRevenue.length === 0 ? (
              <div style={{ color: "#8a93a3", fontSize: 13 }}>No active data-product purchases have been recorded yet.</div>
            ) : model.monthlyRevenue.map((row) => (
              <div key={row.month} style={{ display: "grid", gridTemplateColumns: "80px 1fr 90px", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#b7bdc8", fontSize: 12 }}>{row.month}</span>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, (row.estimatedActiveRevenueUsd / Math.max(1, model.estimatedActiveRevenueUsd)) * 100)}%`, height: "100%", background: "#22C55E" }} />
                </div>
                <span style={{ color: "#fff", fontSize: 12, fontWeight: 800, textAlign: "right" }}>{money(row.estimatedActiveRevenueUsd)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18, background: "rgba(255,255,255,0.025)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 850, margin: "0 0 14px" }}>Status Mix</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {Object.entries(model.statusCounts).length === 0 ? (
              <div style={{ color: "#8a93a3", fontSize: 13 }}>No purchase states recorded.</div>
            ) : Object.entries(model.statusCounts).map(([status, count]) => (
              <div key={status} style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontSize: 13 }}>
                <span>{status}</span>
                <strong>{count.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
        {model.products.map(({ product, totalPurchases, activePurchases, pendingPurchases, estimatedActiveRevenueUsd, estimatedMrrUsd, fulfillmentRequired, countries }) => (
          <article key={product.id} style={{ padding: 18, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 850 }}>{product.name}</div>
                <div style={{ color: "#8a93a3", fontSize: 11, marginTop: 4 }}>{product.description}</div>
              </div>
              <span style={{ height: 22, padding: "3px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800, color: product.active ? "#22C55E" : "#8a93a3", background: product.active ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)" }}>
                {product.active ? "ACTIVE" : "DRAFT"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <Metric icon={<ShoppingBag size={13} />} label="Purchases" value={totalPurchases.toLocaleString()} />
              <Metric icon={<Package size={13} />} label="Active" value={activePurchases.toLocaleString()} />
              <Metric icon={<DollarSign size={13} />} label="Revenue" value={money(estimatedActiveRevenueUsd)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
              <Metric icon={<Clock size={13} />} label="Pending" value={pendingPurchases.toLocaleString()} />
              <Metric icon={<AlertTriangle size={13} />} label="Fulfill" value={fulfillmentRequired.toLocaleString()} />
              <Metric icon={<Globe size={13} />} label="Countries" value={countries.length ? countries.length.toString() : product.country_scope.includes("ALL") ? "120" : product.country_scope.length.toString()} />
            </div>

            <div style={{ marginTop: 12, color: "#8a93a3", fontSize: 10 }}>
              Price: <strong style={{ color: "#C6923A" }}>{product.price_usd === 0 ? "Plan gated" : money(product.price_usd)}</strong>
              {product.purchase_type === "subscription" ? " / month" : ""} - MRR {money(estimatedMrrUsd)}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ borderRadius: 8, padding: 10, background: "rgba(255,255,255,0.035)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#8a93a3", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
        {icon}
        {label}
      </div>
      <div style={{ color: "#fff", fontSize: 16, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
}
