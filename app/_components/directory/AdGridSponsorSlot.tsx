import { TrackedLink } from '@/app/_components/TrackedLink';

export function AdGridSponsorSlot({ regionName, type, countryCode }: { regionName: string, type: 'operator' | 'hotel' | 'repair', countryCode: string }) {
  return (
    <div className="block p-5 border-2 border-dashed border-amber-500/30 bg-amber-500/[0.03] rounded-xl transition-all hover:bg-amber-500/[0.05] relative isolate">
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase rounded tracking-wider">
        AdGrid Pre-Launch
      </div>
      <div className="flex flex-col h-full justify-center text-center">
        <h3 className="font-bold text-lg text-amber-400 mb-2 mt-4">Own the top spot in {regionName}</h3>
        <p className="text-sm text-gray-400 mb-4 px-2">
          Brokers are actively searching for a verified {type} in {regionName}. Capture 100% of the intent for this corridor by sponsoring this position.
        </p>
        <div className="text-center mt-2">
          <TrackedLink
            href={`/sponsor/waitlist?regionName=${encodeURIComponent(regionName)}&type=${encodeURIComponent(type)}&country=${encodeURIComponent(countryCode)}`}
            className="inline-flex mx-auto items-center justify-center px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase tracking-wider text-sm rounded-lg transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            eventName="sponsor_waitlist_click"
            eventParams={{ region_name: regionName, entity_type: type, country_code: countryCode, block_name: 'adgrid_native' }}
          >
            Join the VIP Waitlist
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}
