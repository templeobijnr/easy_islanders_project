import React, { useEffect, useMemo, useState } from "react";

/**
 * Chat‑first Marketplace Prototype — Rev 6
 * Changes:
 * 1) Featured sits **below the chat** (full width) with its **own scroll**
 * 2) **Bigger chat area** (taller thread; sticky composer)
 * 3) **Inline horizontal recommendations**: carousel pops up under the thread with scannable cards
 * 4) Featured upgraded to **tabs + spotlight + large cards** + badges
 * 5) **No right rail** (everything via chat + featured)
 * 6) Events / Things to do / Deals lanes + Trust strip (Protected bookings • Clear receipts • No auto‑charges)
 */

const JOB_CHIPS = [
  { id: "place", label: "Find a place", icon: "🏠", hint: "2+1 near EMU under ₺20k" },
  { id: "car", label: "Book a car", icon: "🚗", hint: "Compact Fri→Mon, pickup Kyrenia" },
  { id: "night", label: "Plan a night out", icon: "🎶", hint: "Live music near harbor 20:00" },
  { id: "help", label: "Get help at home", icon: "🧹", hint: "Deep clean tomorrow 09:00" },
  { id: "transfer", label: "Airport transfer", icon: "🛬", hint: "ERCAN → Kyrenia tonight 18:30" },
  { id: "weekend", label: "Weekend in Karpaz", icon: "🏖️", hint: "Sat→Sun, budget ₺3,500" },
];

const REFINERS: Record<string, string[]> = {
  place: ["closer", "cheaper", "newer", "furnished", "no prepay"],
  car: ["automatic", "child seat", "near me", "no deposit"],
  night: ["near harbor", "live music", "quiet", "8pm", "₺2,500"],
  help: ["tomorrow", "morning", "bring supplies", "one‑time"],
  transfer: ["tonight", "4 pax", "2 bags", "meet at arrivals"],
  weekend: ["sea view", "breakfast", "free cancel", "<30km"],
};

// Light mock data to feed inline horizontal recs beneath chat
const MOCK_RESULTS: Record<string, Array<any>> = {
  place: [
    { id: "apt-1", title: "2+1 • Kyrenia Center • Furnished", reason: "400m from Harbor • ₺19,800 • Available Fri 18:00", price: "₺19,800/mo" },
    { id: "apt-2", title: "1+1 • Near EMU • New Build", reason: "1.1km • ₺16,500 • No prepay", price: "₺16,500/mo" },
    { id: "apt-3", title: "2+1 • Zeytinlik", reason: "8 min walk • ₺20,200 • Pets OK", price: "₺20,200/mo" },
  ],
  car: [
    { id: "car-1", title: "Compact • Automatic", reason: "Pickup Fri 10:00 • 1.2km • Deposit ₺0", price: "₺1,100/day" },
    { id: "car-2", title: "SUV 5-seat", reason: "Airport pickup • Sat 09:00", price: "₺1,800/day" },
  ],
  night: [
    { id: "n1", title: "Harbor Jazz Bar", reason: "Live jazz 20:30 • 450m • Avg ₺2,100 for two", price: "Table 20:00" },
    { id: "n2", title: "Seaview Meze House", reason: "Quiet terrace • 650m • Avg ₺1,600", price: "Table 20:15" },
  ],
  help: [
    { id: "h1", title: "Deep Clean (2 cleaners)", reason: "Tomorrow 09:00 • Brings supplies • 2h", price: "₺850" },
  ],
  transfer: [
    { id: "t1", title: "Airport → Kyrenia (Sedan)", reason: "Meet at arrivals • 2 bags • 35min", price: "₺750" },
  ],
  weekend: [
    { id: "w1", title: "Karpaz Guesthouse", reason: "Breakfast • Free cancel • 28km", price: "₺1,900/night" },
  ],
};

// Featured categories
const FEATURED_TABS = ["Hotels", "Car Rentals", "Restaurants", "Beaches"] as const;

type Tab = typeof FEATURED_TABS[number];

const FEATURED_ITEMS: Record<Tab, Array<{id:string; title:string; blurb:string; emoji:string}>> = {
  Hotels: [
    { id: "fh1", title: "Harbor Boutique", blurb: "Sea view • Late checkout", emoji: "🏨" },
    { id: "fh2", title: "Olive Grove Suites", blurb: "Breakfast included", emoji: "🫒" },
    { id: "fh3", title: "Zeytinlik Stay", blurb: "Walk to old town", emoji: "🌿" },
  ],
  "Car Rentals": [
    { id: "fc1", title: "Compact Automatic", blurb: "Deposit ₺0 • Airport pickup", emoji: "🚗" },
    { id: "fc2", title: "SUV 5‑seat", blurb: "Child seat on request", emoji: "🚙" },
    { id: "fc3", title: "Convertible", blurb: "Weekend special", emoji: "🕶️" },
  ],
  Restaurants: [
    { id: "fr1", title: "Harbor Jazz Bar", blurb: "Live jazz 20:30", emoji: "🎷" },
    { id: "fr2", title: "Meze House", blurb: "Quiet terrace", emoji: "🥗" },
    { id: "fr3", title: "Rooftop Lounge", blurb: "Sunset views", emoji: "🌇" },
  ],
  Beaches: [
    { id: "fb1", title: "Karpaz Golden", blurb: "Dunes • Turtles", emoji: "🏖️" },
    { id: "fb2", title: "Alagadi", blurb: "Family friendly", emoji: "🦀" },
    { id: "fb3", title: "Escape Beach", blurb: "Clubs • Water sports", emoji: "🏄" },
  ],
};

// Additional featured lanes
const EVENTS = [
  { id: "e1", title: "Live Jazz Night", meta: "Harbor • Thu 20:30", emoji: "🎷" },
  { id: "e2", title: "Beach Sunset Party", meta: "Escape • Sat 19:00", emoji: "🌅" },
  { id: "e3", title: "Farmers Market", meta: "Old Town • Sun 10:00", emoji: "🧺" },
];

const TODO = [
  { id: "td1", title: "Kyrenia Castle + Harbor Walk", meta: "2h • Easy • Great photos", emoji: "🏰" },
  { id: "td2", title: "Alagadi Turtle Spotting", meta: "Family • 40min drive", emoji: "🐢" },
  { id: "td3", title: "Karpaz Day Trip", meta: "Beaches + meze", emoji: "🗺️" },
];

const DEALS = [
  { id: "d1", title: "Compact Car Weekend", meta: "Fri→Mon • −15% • Airport pickup", emoji: "🚗" },
  { id: "d2", title: "Harbor Boutique — 2 nights", meta: "Late checkout • Breakfast", emoji: "🏨" },
  { id: "d3", title: "Meze Tasting for 2", meta: "Near harbor • Set menu", emoji: "🥗" },
];

function Chip({ label, icon, onClick, active }:{ label:string; icon:string; onClick?:()=>void; active?:boolean }){
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm shadow-sm hover:shadow transition ${
        active ? "bg-lime-100 border-lime-300" : "bg-white border-slate-200"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function TypingDots(){
  return (
    <span className="inline-flex gap-1 items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0s]"></span>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
    </span>
  );
}

function RecommendationCard({ item, onUse }:{ item:any; onUse:(item:any)=>void }){
  return (
    <button onClick={()=>onUse(item)} className="w-72 text-left shrink-0 rounded-2xl border border-slate-200 bg-white hover:shadow-md overflow-hidden">
      <div className="h-28 bg-slate-100 flex items-center justify-center text-slate-400">image</div>
      <div className="p-3">
        <div className="text-sm font-semibold line-clamp-1">{item.title}</div>
        <div className="text-xs text-slate-600 line-clamp-2">{item.reason}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold">{item.price}</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full border">⭐ 4.6</span>
        </div>
      </div>
    </button>
  );
}

export default function App(){
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{role:"user"|"agent"; text:string}>>([
    { role: "agent", text: "Hi! Tell me what you need and I’ll build a shortlist you can approve." },
  ]);
  const [composer, setComposer] = useState("");
  const [typing, setTyping] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>(FEATURED_TABS[0]);

  function startJob(jobId:string){
    setActiveJob(jobId);
    const chip = JOB_CHIPS.find(c=>c.id===jobId)!;
    setMessages((m)=>[
      ...m,
      { role: "user", text: `${chip.icon} ${chip.label}` },
      { role: "agent", text: `Got it. ${chip.hint}. Here are options with reasons — want to refine?` },
    ]);
  }

  function addRefiner(r:string){
    setMessages((m)=>[...m, { role: "user", text: r }, { role: "agent", text: `Okay, prioritizing \"${r}\"… shortlist updated.` }]);
  }

  function sendMessage(){
    if(!composer.trim()) return;
    const text = composer.trim();
    setComposer("");
    setMessages((m)=>[...m, { role: "user", text }]);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMessages((m)=>[...m, { role: "agent", text: "Thanks — updating your shortlist now." }]);
    }, 800);
  }

  // Spotlight auto-advance (picks from current tab)
  const [spot, setSpot] = useState(0);
  useEffect(()=>{
    const id = setInterval(()=> setSpot((i)=> (i+1)%FEATURED_ITEMS[activeTab].length), 3500);
    return ()=> clearInterval(id);
  },[activeTab]);

  const spotlight = useMemo(()=> FEATURED_ITEMS[activeTab][spot], [activeTab, spot]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 text-slate-900 flex">
      {/* Left rail */}
      <aside className="w-72 p-4 border-r border-slate-200 bg-white/90 backdrop-blur">
        <div className="relative overflow-hidden rounded-xl mb-4 p-3 bg-gradient-to-r from-lime-200 via-emerald-200 to-sky-200">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-lime-600 shadow-inner" />
            <div className="font-semibold">EasyIslanders</div>
          </div>
          <div className="text-xs text-slate-700 mt-1">Ask once. Get it done—locally.</div>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/40"/>
        </div>
        <div className="text-xs text-slate-500 mb-2">Jobs to do</div>
        <div className="space-y-2">
          {JOB_CHIPS.map((c)=> (
            <Chip key={c.id} label={c.label} icon={c.icon} onClick={()=>startJob(c.id)} active={activeJob===c.id} />
          ))}
        </div>
        <div className="mt-6 text-[11px] text-slate-500">Powered by your agent • Explicit confirmations only</div>
      </aside>

      {/* Main content — no right rail */}
      <main className="flex-1 p-6">
        <section className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-0 flex flex-col">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur rounded-t-2xl border-b border-slate-100 z-10">
            <div className="font-medium">Chat</div>
            <div className="text-xs text-slate-500">Press <kbd className="px-1 py-0.5 border rounded">/</kbd> for commands • <kbd className="px-1 py-0.5 border rounded">⌘K</kbd> to search</div>
          </div>

          {/* Thread (independent scroll) */}
          <div className="px-4 flex-1 overflow-auto space-y-3 max-h-[58vh]">
            {messages.map((m, i)=> (
              <div key={i} className={`max-w-[85%] text-sm p-3 rounded-2xl ${m.role==="agent"?"bg-slate-100":"bg-lime-100 ml-auto"}`}>{m.text}</div>
            ))}
            {typing && (
              <div className="max-w-[60%] text-sm p-3 rounded-2xl bg-slate-100 inline-flex items-center gap-2"><TypingDots/><span className="text-slate-500">Thinking…</span></div>
            )}
          </div>

          {/* Inline horizontal recommendations (pop under thread) */}
          {activeJob && (
            <div className="px-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Recommended for your request</div>
                <button className="text-[11px] underline" onClick={()=>setActiveTab(activeJob==="place"?"Hotels":activeJob==="car"?"Car Rentals":activeJob==="night"?"Restaurants":"Beaches")}>See more</button>
              </div>
              <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex gap-3 min-w-max pr-2">
                  {(MOCK_RESULTS[activeJob]||[]).map((it)=> (
                    <RecommendationCard key={it.id} item={it} onUse={(item)=>setMessages((m)=>[...m, { role:'user', text: `Consider: ${item.title}` }])} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="px-4 mt-2 flex flex-wrap gap-2">
            {(activeJob ? REFINERS[activeJob] : ["student arrival pack","viewing day","date night","airport transfer"]).map((r)=> (
              <button key={r} onClick={()=>addRefiner(r)} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs hover:bg-slate-50">{r}</button>
            ))}
          </div>

          {/* Composer — sticky at bottom of chat area */}
          <div className="px-4 pt-2 sticky bottom-0 bg-white/80 backdrop-blur rounded-b-2xl z-10">
            <div className="flex items-center gap-2 p-2 border-2 border-slate-200 rounded-2xl focus-within:border-lime-400 bg-white">
              <button className="px-2 py-1 text-slate-500 rounded-lg hover:bg-slate-50" title="Attach">📎</button>
              <input
                value={composer}
                onChange={(e)=>setComposer(e.target.value)}
                onKeyDown={(e)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }}}
                placeholder={activeJob ? "Type details or paste a link…" : "Tell us the job and any must‑haves…"}
                className="flex-1 outline-none text-sm placeholder:text-slate-400"
              />
              <button onClick={sendMessage} className="px-3 py-1.5 rounded-xl bg-lime-600 text-white text-sm hover:bg-lime-700">Send</button>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 mb-2">Tip: Try "/viewings Fri 18:00" or "/budget 2500".</div>
          </div>

          {/* FEATURED — full width, own vertical scroll */}
          <div className="px-4 pb-4 mt-2 max-h-[42vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Featured for you</h3>
              <div className="flex gap-2">
                {FEATURED_TABS.map((t)=> (
                  <button key={t}
                          onClick={()=>setActiveTab(t)}
                          className={`px-3 py-1.5 rounded-2xl border text-xs ${activeTab===t?"bg-lime-100 border-lime-300":"bg-white border-slate-200"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Spotlight banner */}
            <div className="mt-3 p-4 rounded-2xl border border-slate-200 bg-gradient-to-r from-lime-50 to-emerald-50 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{spotlight.title}</div>
                <div className="text-xs text-slate-600">{spotlight.blurb}</div>
              </div>
              <div className="text-2xl">{spotlight.emoji}</div>
            </div>

            {/* Big card grid */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {FEATURED_ITEMS[activeTab].map((f)=> (
                <button key={f.id}
                        className="group text-left p-0 rounded-2xl border border-slate-200 bg-white hover:shadow-md overflow-hidden"
                        onClick={()=>{ setMessages((m)=>[...m, { role: 'user', text: `${f.emoji} ${f.title}` }]); }}>
                  <div className="h-36 bg-slate-100 flex items-center justify-center text-slate-400">image</div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{f.title}</div>
                      <div className="text-xs">{f.emoji}</div>
                    </div>
                    <div className="text-xs text-slate-600">{f.blurb}</div>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-full border">⭐ 4.7</span>
                      <span className="px-2 py-0.5 rounded-full border">Free cancel</span>
                      <span className="px-2 py-0.5 rounded-full border">Near harbor</span>
                    </div>
                    <div className="mt-3 text-xs text-lime-700">Tap to ask the agent for this</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Events */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Events this week</div>
                <button className="text-xs underline">View all</button>
              </div>
              <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex gap-3 min-w-max pr-2">
                  {EVENTS.map((e)=> (
                    <button key={e.id} className="w-64 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow text-left shrink-0" onClick={()=>setMessages((m)=>[...m, { role:'user', text: `${e.emoji} ${e.title} ${e.meta}` }])}>
                      <div className="text-xl">{e.emoji}</div>
                      <div className="text-sm font-medium mt-1">{e.title}</div>
                      <div className="text-xs text-slate-600">{e.meta}</div>
                      <div className="mt-2 text-xs text-lime-700">Ask to book a table/tickets</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Things to do */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Things to do</div>
                <button className="text-xs underline">View all</button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-max pr-2">
                  {TODO.map((t)=> (
                    <button key={t.id} className="w-64 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow text-left shrink-0" onClick={()=>setMessages((m)=>[...m, { role:'user', text: `${t.emoji} ${t.title}` }])}>
                      <div className="text-xl">{t.emoji}</div>
                      <div className="text-sm font-medium mt-1">{t.title}</div>
                      <div className="text-xs text-slate-600">{t.meta}</div>
                      <div className="mt-2 text-xs text-lime-700">Ask for a plan & timings</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Deals */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Deals</div>
                <button className="text-xs underline">View all</button>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-3 min-w-max pr-2">
                  {DEALS.map((d)=> (
                    <button key={d.id} className="w-64 p-4 rounded-2xl border border-slate-200 bg-white hover:shadow text-left shrink-0" onClick={()=>setMessages((m)=>[...m, { role:'user', text: `${d.emoji} ${d.title}` }])}>
                      <div className="text-xl">{d.emoji}</div>
                      <div className="text-sm font-medium mt-1">{d.title}</div>
                      <div className="text-xs text-slate-600">{d.meta}</div>
                      <div className="mt-2 text-xs text-lime-700">Ask to apply this deal</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div className="rounded-xl border border-slate-200 p-2">✅ Protected bookings</div>
              <div className="rounded-xl border border-slate-200 p-2">🧾 Clear receipts & changes</div>
              <div className="rounded-xl border border-slate-200 p-2">🤝 No auto‑charges — explicit confirm</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
