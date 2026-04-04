interface ClaimCTAProps { operatorId: string; operatorName: string; hcId: string | null }
export function ClaimProfileCTA({ operatorId, operatorName, hcId }: ClaimCTAProps) {
  return (
    <div className="bg-[#2a1f08] border border-[#d4950e40] rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.1em] text-[#d4950e] font-semibold mb-2">IS THIS YOUR BUSINESS?</p>
          <h3 className="text-lg font-bold text-[#f0f2f5] mb-2">Claim {operatorName}</h3>
          <p className="text-sm text-[#8a7050] mb-3">Free to claim. HC ID: <span className="font-mono text-[#d4950e]">{hcId??'Pending'}</span></p>
          <ul className="space-y-1 text-xs text-[#8a7050]">
            <li>✓ Priority placement in search results</li>
            <li>✓ Verified badge on your profile</li>
            <li>✓ Real-time load alerts in your corridor</li>
            <li>✓ Analytics — who&apos;s viewing your profile</li>
          </ul>
        </div>
        <a href={`/claim?operator=${operatorId}`} className="block flex-shrink-0 bg-[#d4950e] text-[#07090d] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#e8a828] text-center whitespace-nowrap">Claim Free Profile →</a>
      </div>
    </div>
  )
}
