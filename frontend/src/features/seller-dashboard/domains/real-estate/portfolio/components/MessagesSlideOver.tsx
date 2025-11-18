import React, { useMemo, useState } from 'react'

interface ThreadSummary {
  id: string
  listingTitle?: string
  customerName: string
  unread: number
  lastMessagePreview: string
}

interface ChatMessage {
  id: string
  sender: 'business' | 'customer'
  text: string
  ts: string
}

interface MessagesSlideOverProps {
  listingId: string | 'all'
  threads: ThreadSummary[]
  messagesByThread: Record<string, ChatMessage[]>
  onSendMessage: (threadId: string, text: string) => void
  onClose: () => void
}

const MessagesSlideOver: React.FC<MessagesSlideOverProps> = ({ listingId, threads, messagesByThread, onSendMessage, onClose }) => {
  const [activeThreadId, setActiveThreadId] = useState<string>(threads[0]?.id ?? '')
  const [composerText, setComposerText] = useState('')

  const activeMessages = useMemo(() => messagesByThread[activeThreadId] ?? [], [activeThreadId, messagesByThread])
  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId), [threads, activeThreadId])

  const sendMessage = () => {
    const t = composerText.trim()
    if (!t) return
    onSendMessage(activeThreadId, t)
    setComposerText('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full max-w-3xl shadow-xl">
        <div className="p-4 border-b border-[hsl(var(--sand-200))] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[hsl(var(--sand-600))]">Inbox</span>
            <span className="text-xs text-[hsl(var(--sand-500))]">{listingId === 'all' ? 'All listings' : `Listing ${listingId}`}</span>
          </div>
          <button onClick={onClose} className="px-3 py-2 rounded-[var(--radius-md)] bg-[hsl(var(--sand-50))] border border-[hsl(var(--sand-200))] text-[hsl(var(--sand-700))] hover:bg-[hsl(var(--ocean-50))] hover:border-[hsl(var(--ocean-300))]">Close</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          <div className="border-r border-[hsl(var(--sand-200))] p-3 md:col-span-1">
            <div className="mb-2">
              <input className="w-full px-3 py-2 rounded-[var(--radius-md)] bg-white border border-[hsl(var(--sand-200))] text-[hsl(var(--sand-900))] placeholder:text-[hsl(var(--sand-600))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ocean-500))]" placeholder="Search conversations" />
            </div>
            <div className="space-y-2 max-h-[calc(100vh-160px)] overflow-y-auto">
              {threads.map(t => (
                <button key={t.id} onClick={() => setActiveThreadId(t.id)} className={`w-full text-left p-3 rounded-[var(--radius-md)] transition-colors ${activeThreadId === t.id ? 'bg-[hsl(var(--ocean-50))] border border-[hsl(var(--ocean-300))]' : 'bg-white border border-[hsl(var(--sand-200))] hover:bg-[hsl(var(--sand-50))]'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[hsl(var(--sand-900))]">{t.customerName}</div>
                    {t.unread > 0 && <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-[hsl(var(--ocean-500))] text-white">{t.unread}</span>}
                  </div>
                  {t.listingTitle && <div className="text-xs text-[hsl(var(--sand-600))]">{t.listingTitle}</div>}
                  <div className="text-xs text-[hsl(var(--sand-600))] mt-1 line-clamp-1">{t.lastMessagePreview}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--sand-200))] flex items-center justify-between">
              <div>
                <div className="font-semibold text-[hsl(var(--sand-900))]">{activeThread?.customerName ?? 'Conversation'}</div>
                {activeThread?.listingTitle && <div className="text-xs text-[hsl(var(--sand-600))]">{activeThread.listingTitle}</div>}
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[hsl(var(--sand-50))]">
              {activeMessages.map(m => (
                <div key={m.id} className={`max-w-[80%] p-3 rounded-[var(--radius-md)] ${m.sender === 'business' ? 'ml-auto bg-white border border-[hsl(var(--ocean-300))] text-[hsl(var(--sand-900))]' : 'mr-auto bg-white/90 border border-[hsl(var(--sand-200))] text-[hsl(var(--sand-900))]'}`}>
                  <div className="text-sm">{m.text}</div>
                  <div className="text-[10px] text-[hsl(var(--sand-500))] mt-1">{new Date(m.ts).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[hsl(var(--sand-200))] bg-white">
              <div className="flex items-center gap-2">
                <input value={composerText} onChange={e => setComposerText(e.target.value)} placeholder="Type a message" className="flex-1 px-3 py-2 rounded-[var(--radius-md)] bg-white border border-[hsl(var(--sand-300))] text-[hsl(var(--sand-900))] placeholder:text-[hsl(var(--sand-600))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ocean-500))]" />
                <button onClick={sendMessage} className="px-4 py-2 rounded-[var(--radius-md)] bg-[hsl(var(--ocean-500))] text-white hover:bg-[hsl(var(--ocean-600))]">Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesSlideOver
