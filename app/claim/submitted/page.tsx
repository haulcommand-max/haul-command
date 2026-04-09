import Link from 'next/link'

export default function ClaimSubmitted() {
  return (
    <div className="min-h-screen bg-[#07090d] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-5">✅</div>
        <h1 className="text-2xl font-extrabold text-[#22c55e] mb-3">Claim Submitted</h1>
        <p className="text-sm text-[#8a9ab0] mb-6 leading-relaxed">
          Your claim is under review. We typically review claims within 24 hours. You&apos;ll receive a push notification and email when your profile is verified.
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link href="/dashboard" className="bg-[#d4950e] hover:bg-[#c4850e] text-white font-bold py-3 rounded-xl text-sm text-center">Go to Dashboard</Link>
          <Link href="/training" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#d4950e] py-3 rounded-xl text-sm text-center">Take a Free Training Course</Link>
          <Link href="/available-now/broadcast" className="border border-[#1e3048] text-[#8a9ab0] hover:border-[#22c55e] py-3 rounded-xl text-sm text-center">Broadcast Your Availability</Link>
        </div>
      </div>
    </div>
  )
}
