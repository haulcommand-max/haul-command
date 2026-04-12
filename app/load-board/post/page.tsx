import { Metadata } from 'next'
import { HcBottomNav } from '@/components/layout/HcBottomNav'
import { LoadBoardPostClient } from '@/components/load-board/LoadBoardPostClient'


export const metadata: Metadata = {
  title: 'Post a Route Request | Haul Command',
  description: 'Submit an oversize load routing or escort request to our global network of verified professionals.',
}

export default function LoadBoardPostPage() {
  return (
    <div className=" bg-[#07090d] text-white font-sans selection:bg-blue-500/30">

      <main className="container max-w-3xl mx-auto px-4 py-8 md:py-16 pb-32">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Post to Load Board
          </h1>
          <p className="text-slate-400 text-lg">
            Broadcast your escort or routing requirements to matching operators.
          </p>
        </div>

        <LoadBoardPostClient />
      </main>

      <HcBottomNav />
    </div>
  )
}