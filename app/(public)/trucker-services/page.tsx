import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  ChevronRight, Truck, Wrench, Shield, Fuel, MapPin, Scale,
  Phone, Package, Snowflake, Eye, Building, Car, Gauge, HardHat,
  ShoppingCart, AlertTriangle, Navigation, Zap, FileText, Search
} from 'lucide-react';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { SnippetInjector } from '@/components/seo/SnippetInjector';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRUCKER SERVICES DIRECTORY — Powered by public.places + place_type_metadata
// Absorbs TruckStopsAndServices.com's entire category taxonomy
// All data routes through the Claimable Places Engine
// No duplication — single source of truth in Supabase
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const ICON_MAP: Record<string, any> = {
  MapPin, Truck, Wrench, Shield, Fuel, Scale, Phone, Package,
  Snowflake, Eye, Building, Car, Gauge, HardHat, ShoppingCart,
  AlertTriangle, Navigation, Zap, FileText, Search,
};

const GROUP_LABELS: Record<string, { title: string; order: number }> = {
  core_escort:         { title: 'â˜… Haul Command Core Services', order: 0 },
  repair_maintenance:  { title: 'Repair & Maintenance', order: 1 },
  tires_fuel:          { title: 'Tires, Fuel & Fluids', order: 2 },
  towing_emergency:    { title: 'Towing & Emergency Services', order: 3 },
  stops_parking:       { title: 'Stops, Parking & Rest Areas', order: 4 },
  wash_clean:          { title: 'Wash & Clean', order: 5 },
  scales_compliance:   { title: 'Scales & Compliance', order: 6 },
  parts_supplies:      { title: 'Parts, Supplies & Accessories', order: 7 },
  dealers_sales:       { title: 'Dealers & Sales', order: 8 },
  logistics_business:  { title: 'Insurance, Brokerage & Business', order: 9 },
  food_lodging:        { title: 'Food & Lodging with Truck Parking', order: 10 },
  general:             { title: 'Other Services', order: 99 },
};

interface CategoryMeta {
  place_type: string;
  display_name: string;
  description: string;
  icon_name: string;
  slug: string;
  category_group: string;
  sort_order: number;
  listing_count?: number;
}

async function getCategories(): Promise<CategoryMeta[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('place_type_metadata')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return getFallbackCategories();
    }
    return data as CategoryMeta[];
  } catch {
    return getFallbackCategories();
  }
}

function getFallbackCategories(): CategoryMeta[] {
  // Hardcoded fallback if Supabase is unreachable — matches migration seed exactly
  return [
    { place_type: 'pilot_car_company', display_name: 'Pilot Car Companies', description: 'Certified escort vehicle operators with verified insurance and equipment.', icon_name: 'Car', slug: 'pilot-car-companies', category_group: 'core_escort', sort_order: 1 },
    { place_type: 'truck_stop', display_name: 'Truck Stops', description: 'Full-service truck stops with fuel, showers, parking, and amenities.', icon_name: 'MapPin', slug: 'truck-stops', category_group: 'stops_parking', sort_order: 10 },
    { place_type: 'tow_rotator', display_name: 'Towing & Wrecker Service', description: 'Heavy-duty towing, rotator service, and wrecker dispatch.', icon_name: 'Truck', slug: 'towing', category_group: 'towing_emergency', sort_order: 12 },
    { place_type: 'rest_area', display_name: 'Rest Areas', description: 'Highway rest areas and turnouts with amenities and parking capacity.', icon_name: 'MapPin', slug: 'rest-areas', category_group: 'stops_parking', sort_order: 15 },
    { place_type: 'repair_shop', display_name: 'Truck & Trailer Repair', description: 'Full-service repair shops for commercial trucks and trailers.', icon_name: 'Wrench', slug: 'truck-trailer-repair', category_group: 'repair_maintenance', sort_order: 20 },
    { place_type: 'mobile_truck_repair', display_name: 'Mobile Truck / Trailer Repair', description: 'Roadside repair services — mobile mechanics for breakdowns.', icon_name: 'Wrench', slug: 'mobile-repair', category_group: 'repair_maintenance', sort_order: 21 },
    { place_type: 'garages_shops', display_name: 'Garages / Shops', description: 'General auto and truck repair garages.', icon_name: 'Wrench', slug: 'garages', category_group: 'repair_maintenance', sort_order: 22 },
    { place_type: 'tire_shop', display_name: 'Tire Repair & Sales', description: 'Commercial tire sales, repair, retreading, and 24/7 roadside service.', icon_name: 'Gauge', slug: 'tire-repair', category_group: 'repair_maintenance', sort_order: 25 },
    { place_type: 'body_shop', display_name: 'Body Shop', description: 'Collision repair, paint, and body work for commercial vehicles.', icon_name: 'HardHat', slug: 'body-shop', category_group: 'repair_maintenance', sort_order: 26 },
    { place_type: 'hydraulics', display_name: 'Hydraulics', description: 'Hydraulic system repair, hose replacement, and pump service.', icon_name: 'Zap', slug: 'hydraulics', category_group: 'repair_maintenance', sort_order: 27 },
    { place_type: 'welding', display_name: 'Welding', description: 'Mobile and shop welding for trailer frames and structural repair.', icon_name: 'Zap', slug: 'welding', category_group: 'repair_maintenance', sort_order: 28 },
    { place_type: 'glass_repair', display_name: 'Glass Repair & Sales', description: 'Windshield replacement and glass repair for commercial trucks.', icon_name: 'Eye', slug: 'glass-repair', category_group: 'repair_maintenance', sort_order: 29 },
    { place_type: 'reefer_repair', display_name: 'Reefer Repairs', description: 'Refrigeration unit repair for temperature-controlled transport.', icon_name: 'Snowflake', slug: 'reefer-repairs', category_group: 'repair_maintenance', sort_order: 30 },
    { place_type: 'truck_parking', display_name: 'Secure Trailer Drop Yard & Parking', description: 'Fenced, surveilled trailer parking and drop yards.', icon_name: 'Shield', slug: 'drop-yards', category_group: 'stops_parking', sort_order: 30 },
    { place_type: 'secure_storage', display_name: 'Secure Storage', description: 'Enclosed and open storage for equipment, trailers, and cargo.', icon_name: 'Package', slug: 'secure-storage', category_group: 'stops_parking', sort_order: 32 },
    { place_type: 'scale_weigh_station_public', display_name: 'State Weigh Stations', description: 'Weigh station locations, hours, and bypass programs.', icon_name: 'Scale', slug: 'weigh-stations', category_group: 'scales_compliance', sort_order: 35 },
    { place_type: 'cat_scale', display_name: 'CAT Scale Locations', description: 'Certified truck scale locations for weight verification.', icon_name: 'Scale', slug: 'cat-scales', category_group: 'scales_compliance', sort_order: 36 },
    { place_type: 'oil_lube', display_name: 'Oil & Lube', description: 'Quick oil change, lubrication, and preventive maintenance.', icon_name: 'Fuel', slug: 'oil-lube', category_group: 'tires_fuel', sort_order: 40 },
    { place_type: 'mobile_fueling', display_name: 'Mobile Fueling', description: 'On-site fuel delivery for fleet yards and staging areas.', icon_name: 'Fuel', slug: 'fuel-delivery', category_group: 'tires_fuel', sort_order: 42 },
    { place_type: 'oil_delivery', display_name: 'Oil Supplies — Delivery', description: 'Bulk oil, lubricant, and fluid delivery services.', icon_name: 'Package', slug: 'oil-delivery', category_group: 'tires_fuel', sort_order: 43 },
    { place_type: 'spill_response', display_name: 'Spill Response', description: 'Hazmat spill cleanup and OSHA-compliant containment.', icon_name: 'AlertTriangle', slug: 'spill-response', category_group: 'towing_emergency', sort_order: 50 },
    { place_type: 'environmental_cleanup', display_name: 'Environmental Clean Up', description: 'Soil remediation, fuel spill cleanup, environmental compliance.', icon_name: 'AlertTriangle', slug: 'environmental-cleanup', category_group: 'towing_emergency', sort_order: 51 },
    { place_type: 'lock_out_service', display_name: 'Lock Out Services', description: '24/7 locksmith and lockout services for commercial trucks.', icon_name: 'Phone', slug: 'lockout', category_group: 'towing_emergency', sort_order: 52 },
    { place_type: 'truck_wash', display_name: 'Truck Wash', description: 'Commercial truck wash — automated, touchless, full-service.', icon_name: 'Truck', slug: 'truck-wash', category_group: 'wash_clean', sort_order: 55 },
    { place_type: 'trailer_wash', display_name: 'Trailer Wash', description: 'Interior and exterior trailer wash for flatbeds, vans, specialty.', icon_name: 'Truck', slug: 'trailer-wash', category_group: 'wash_clean', sort_order: 56 },
    { place_type: 'washout', display_name: 'Trailer / Tanker Wash Out', description: 'Food-grade and chemical tanker cleaning, FDA/DOT compliant.', icon_name: 'Truck', slug: 'tanker-washout', category_group: 'wash_clean', sort_order: 60 },
    { place_type: 'chrome_shop', display_name: 'Chrome Shops', description: 'Chrome accessories, bumpers, stacks, and custom truck upgrades.', icon_name: 'ShoppingCart', slug: 'chrome-shops', category_group: 'parts_supplies', sort_order: 70 },
    { place_type: 'cb_shop', display_name: 'CB Shops', description: 'CB radio sales, installation, and repair.', icon_name: 'Phone', slug: 'cb-shops', category_group: 'parts_supplies', sort_order: 71 },
    { place_type: 'trucker_supplies', display_name: 'Trucker Supplies & Safety Equipment', description: 'Flags, lights, signs, chains, straps, safety gear for oversize loads.', icon_name: 'ShoppingCart', slug: 'supplies', category_group: 'parts_supplies', sort_order: 72 },
    { place_type: 'truck_dealer', display_name: 'Truck & Trailer Dealers', description: 'New and used commercial truck, trailer, and lowboy dealer directory.', icon_name: 'Building', slug: 'dealers', category_group: 'dealers_sales', sort_order: 73 },
    { place_type: 'truck_salvage', display_name: 'Truck Salvage', description: 'Salvage yards and parts recyclers for commercial trucks.', icon_name: 'Wrench', slug: 'salvage', category_group: 'dealers_sales', sort_order: 74 },
    { place_type: 'transportation_broker', display_name: 'Transportation Brokers', description: 'Freight brokers, load boards, carrier-broker matching.', icon_name: 'Navigation', slug: 'brokers', category_group: 'logistics_business', sort_order: 75 },
    { place_type: 'cartage_drayage', display_name: 'Cartage Moves', description: 'Short-haul cartage, port drayage, last-mile delivery.', icon_name: 'Package', slug: 'cartage', category_group: 'logistics_business', sort_order: 76 },
    { place_type: 'truck_insurance', display_name: 'Truck Insurance', description: 'Commercial auto, cargo, liability, and umbrella insurance.', icon_name: 'Shield', slug: 'truck-insurance', category_group: 'logistics_business', sort_order: 77 },
    { place_type: 'truck_driving_jobs', display_name: 'Truck Driving Jobs', description: 'CDL driver jobs, escort operator positions, fleet hiring.', icon_name: 'Truck', slug: 'jobs', category_group: 'logistics_business', sort_order: 78 },
    { place_type: 'restaurant_truck_parking', display_name: 'Restaurants With Truck Parking', description: 'Sit-down restaurants with commercial vehicle parking.', icon_name: 'MapPin', slug: 'restaurants', category_group: 'food_lodging', sort_order: 81 },
    { place_type: 'fast_food_truck_parking', display_name: 'Fast Food With Truck Parking', description: 'Quick-service restaurants with truck/trailer parking.', icon_name: 'MapPin', slug: 'fast-food', category_group: 'food_lodging', sort_order: 82 },
    { place_type: 'motel', display_name: 'Motels With Truck Parking', description: 'Motels offering secure commercial vehicle parking.', icon_name: 'Building', slug: 'motels', category_group: 'food_lodging', sort_order: 83 },
    { place_type: 'walmart_truck_parking', display_name: 'Walmart With Truck Parking', description: 'Walmart locations allowing overnight truck parking.', icon_name: 'MapPin', slug: 'walmart-parking', category_group: 'food_lodging', sort_order: 84 },
    { place_type: 'rv_repair', display_name: 'RV Repair', description: 'RV and recreational vehicle repair.', icon_name: 'Wrench', slug: 'rv-repair', category_group: 'repair_maintenance', sort_order: 90 },
  ];
}

const TRUST_STATS = [
  { value: '46', label: 'Service Categories' },
  { value: '50+', label: 'States Covered' },
  { value: '120', label: 'Countries' },
  { value: '1.5M+', label: 'Operator Network' },
];

export default async function TruckerServicesPage() {
  const categories = await getCategories();
  const gold = '#C6923A';
  const bg = '#080810';
  const muted = '#6b7280';
  const border = 'rgba(255,255,255,0.06)';

  // Group categories
  const grouped = categories.reduce((acc, cat) => {
    const group = cat.category_group || 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, CategoryMeta[]>);

  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (GROUP_LABELS[a]?.order ?? 99) - (GROUP_LABELS[b]?.order ?? 99)
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ position: 'relative', borderBottom: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(198,146,58,0.1), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            <Link href="/" style={{ color: muted, textDecoration: 'none' }}>Home</Link>
            <ChevronRight style={{ width: 12, height: 12 }} />
            <span style={{ color: gold }}>Trucker Services Directory</span>
          </nav>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.25)', borderRadius: 20, marginBottom: 16 }}>
                <Truck style={{ width: 12, height: 12, color: gold }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: 1 }}>Complete Service Directory</span>
              </div>
              <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Trucker Services<br />
                <span style={{ color: gold }}>Directory</span>
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: muted, lineHeight: 1.7, maxWidth: 540 }}>
                Find repair shops, truck stops, towing, scales, parts, and every service a heavy haul operation needs — powered by the world&apos;s largest oversize load logistics platform.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, minWidth: 220 }}>
              {TRUST_STATS.map((s, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: gold }}>{s.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: muted, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ AI Search Answer Block â”€â”€ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 0' }}>
        <StaticAnswerBlock
          question="What trucker services does Haul Command cover?"
          answer="Haul Command's Trucker Services Directory covers 46+ categories including truck stops, towing and wrecker services, truck and trailer repair, tire shops, CAT scale locations, weigh stations, mobile fueling, truck wash facilities, transportation brokers, and specialized services like pilot car operators, reefer repair, and hazmat spill response. Coverage spans 50+ US states and 120 countries."
          source="Haul Command"
          sourceUrl="https://www.haulcommand.com/trucker-services"
          lastVerified="2026-04-03"
          confidence="verified_current"
          ctaLabel="Browse All Categories"
          ctaUrl="/trucker-services"
        />
      </div>

      {/* â”€â”€ Category Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {sortedGroups.map(([groupKey, cats]) => {
          const group = GROUP_LABELS[groupKey] || { title: groupKey, order: 99 };
          const isCore = groupKey === 'core_escort';

          return (
            <div key={groupKey} style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: isCore ? gold : '#f9fafb', marginBottom: 14, borderBottom: `1px solid ${isCore ? 'rgba(198,146,58,0.2)' : border}`, paddingBottom: 8 }}>
                {group.title}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isCore ? 'repeat(auto-fit, minmax(320px, 1fr))' : 'repeat(auto-fill, minmax(270px, 1fr))', gap: isCore ? 14 : 10 }}>
                {cats.map(cat => {
                  const Icon = ICON_MAP[cat.icon_name] || MapPin;
                  const href = isCore ? '/directory' : `/trucker-services/${cat.slug}`;

                  return (
                    <Link key={cat.place_type} href={href} style={{
                      display: 'flex', alignItems: isCore ? 'flex-start' : 'center', gap: isCore ? 16 : 12,
                      padding: isCore ? '1.25rem' : '14px 16px',
                      background: isCore ? 'rgba(198,146,58,0.04)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isCore ? 'rgba(198,146,58,0.2)' : border}`,
                      borderRadius: isCore ? 14 : 12, textDecoration: 'none', color: 'inherit',
                      transition: 'all 0.2s ease',
                    }}>
                      <div style={{
                        width: isCore ? 44 : 36, height: isCore ? 44 : 36, borderRadius: isCore ? 12 : 10,
                        background: isCore ? `linear-gradient(135deg, ${gold}, #E4B872)` : 'rgba(255,255,255,0.04)',
                        border: isCore ? 'none' : `1px solid ${border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon style={{ width: isCore ? 20 : 16, height: isCore ? 20 : 16, color: isCore ? '#000' : muted }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isCore ? 4 : 0 }}>
                          <span style={{ fontSize: isCore ? 14 : 13, fontWeight: isCore ? 800 : 700, color: isCore ? '#f9fafb' : '#e5e7eb' }}>{cat.display_name}</span>
                          {isCore && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${gold}22`, color: gold, textTransform: 'uppercase', letterSpacing: '0.08em' }}>HC Directory</span>
                          )}
                        </div>
                        <div style={{ fontSize: isCore ? 12 : 11, color: muted, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{cat.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* â”€â”€ Regulation Resources (absorbs Oversize.io) â”€â”€ */}
        <div style={{ marginTop: 24, padding: '2rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}`, borderRadius: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', margin: '0 0 8px' }}>
            Oversize / Overweight <span style={{ color: gold }}>Regulations & Compliance</span>
          </h2>
          <p style={{ fontSize: 13, color: muted, margin: '0 0 20px', lineHeight: 1.6 }}>
            State-by-state regulations, permit requirements, and compliance resources.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {[
              { name: 'Pilot Car / Escort Laws by State', href: '/regulations' },
              { name: 'Axle Weight Regulations', href: '/resources/legal/axle-regulations' },
              { name: 'Trip / IRP Permits', href: '/resources/legal/irp-permits' },
              { name: 'Fuel / IFTA Permits', href: '/resources/legal/ifta-permits' },
              { name: 'Oversize / Overweight Fines', href: '/resources/legal/oversize-fines' },
              { name: 'Running Hours & Holiday Restrictions', href: '/resources/legal/holiday-restrictions' },
              { name: 'Flags, Lights & Banners', href: '/resources/equipment/oversize-signage' },
              { name: 'Tire Chain Regulations', href: '/resources/legal/tire-chain-laws' },
              { name: 'Frost Laws by State', href: '/resources/legal/frost-law-guide' },
              { name: 'Annual Permits', href: '/resources/legal/annual-permits' },
              { name: 'Road Conditions & Closures', href: '/resources/data/road-conditions' },
              { name: 'Manufactured Home Transport Laws', href: '/industries/mobile-home' },
            ].map((reg, i) => (
              <Link key={i} href={reg.href} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: 'rgba(198,146,58,0.03)', border: '1px solid rgba(198,146,58,0.1)',
                borderRadius: 10, textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#d1d5db',
              }}>
                <FileText style={{ width: 14, height: 14, color: gold, flexShrink: 0 }} />
                {reg.name}
              </Link>
            ))}
          </div>
        </div>

        {/* â”€â”€ AdGrid — Trucker Services Mid â”€â”€ */}
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <AdGridSlot zone="trucker_services_mid" />
        </div>

        {/* â”€â”€ Bottom CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{
          marginTop: 48, padding: '2.5rem', borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(198,146,58,0.08), rgba(198,146,58,0.02))',
          border: '1px solid rgba(198,146,58,0.15)', textAlign: 'center',
        }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#f9fafb' }}>
            List Your Business on Haul Command
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: muted, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Join the world&apos;s largest oversize load logistics platform. Reach operators and carriers across 120 countries.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/claim" style={{
              display: 'inline-flex', padding: '14px 36px', borderRadius: 12,
              background: `linear-gradient(135deg, ${gold}, #E4B872)`,
              color: '#000', fontSize: 15, fontWeight: 800, textDecoration: 'none',
            }}>
              List Your Company â†’
            </Link>
            <Link href="/directory" style={{
              display: 'inline-flex', padding: '14px 36px', borderRadius: 12,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${border}`,
              color: '#e5e7eb', fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}>
              Browse Directory
            </Link>
          </div>
        </div>
      </div>

      {/* â”€â”€ Snippet Injector — featured snippet capture â”€â”€ */}
      <SnippetInjector
        blocks={['definition', 'faq']}
        term="trucker services"
        geo="United States"
        country="US"
      />
    </div>
  );
}