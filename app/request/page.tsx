import { Suspense } from 'react'
import RequestClient from './RequestClient'

export default function RequestPage() {
  return (
    <Suspense fallback={<div className=" bg-[#07090d] flex items-center justify-center"><div className="h-8 w-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" /></div>}>
      <RequestClient />
    </Suspense>
  )
}