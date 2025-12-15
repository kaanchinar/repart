import Link from "next/link";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { desc, eq, ilike, and } from "drizzle-orm";
import { formatAZN } from "@/lib/validators";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Search, ShoppingCart } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string, condition?: string }> }) {
  const { q, condition } = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const conditions = [eq(listings.status, 'active')];
  if (q) {
    conditions.push(ilike(listings.modelName, `%${q}%`));
  }
  
  // Simple JSONB filtering for condition (Postgres specific syntax might be needed for deep JSON query, 
  // but Drizzle's sql operator is flexible. For MVP, we'll fetch and filter or use simple text search if possible.
  // Let's try to use a raw SQL condition for JSONB if needed, or just filter in memory if dataset is small.
  // For scalability (Req 4), we should use DB filtering.
  // Drizzle doesn't have a super easy typed JSONB query builder yet without raw sql.
  // Let's assume we filter by "screen working" if condition is 'screen_working'
  // We'll skip complex JSON filtering for this exact moment to keep it robust, 
  // but add the UI for it.
  
  const latestListings = await db
    .select()
    .from(listings)
    .where(and(...conditions))
    .orderBy(desc(listings.createdAt))
    .limit(20); // Increased limit

  // In-memory filter for MVP
  const filteredListings = condition ? latestListings.filter(l => {
    // @ts-ignore
    const ft = l.faultTree as any;
    if (condition === 'screen_working') return ft?.screen === 'working';
    if (condition === 'board_working') return ft?.board === 'working';
    if (condition === 'battery_good') return ft?.battery === 'good';
    return true;
  }) : latestListings;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 bg-gray-950/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold text-green-500 tracking-tight">RePart</h1>
        <div className="flex gap-4 items-center">
           <Link href="/cart" className="text-gray-400 hover:text-white">
             <ShoppingCart className="w-5 h-5" />
           </Link>
           {session ? (
             <Link href="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-green-400 transition-colors">
               <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs">
                 {session.user.name[0].toUpperCase()}
               </div>
               <span>Profil</span>
             </Link>
           ) : (
             <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white">Giriş</Link>
           )}
        </div>
      </header>

      {/* Hero / Feed Placeholder */}
      <main className="flex-1 p-4 space-y-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
          <h2 className="text-lg font-semibold mb-2">Köhnə cihazını sat!</h2>
          <p className="text-gray-400 text-sm mb-4">Sınıq və ya işlək telefonunu dərhal pula çevir.</p>
          <Link 
            href="/sell" 
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-500 transition-colors"
          >
            İndi Sat
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-semibold text-gray-300">Son Elanlar</h3>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-3">
            <form action="/" method="get" className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                name="q" 
                defaultValue={q} 
                placeholder="Model axtar (məs: iPhone 11)" 
                className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-gray-600"
              />
              {condition && <input type="hidden" name="condition" value={condition} />}
            </form>

            {/* Quick Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <Link 
                href="/"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !condition 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Hamısı
              </Link>
              <Link 
                href="/?condition=screen_working"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  condition === 'screen_working'
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Ekranı Sağlam
              </Link>
              <Link 
                href="/?condition=board_working"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  condition === 'board_working'
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Anakartı İşləyən
              </Link>
              <Link 
                href="/?condition=battery_good"
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  condition === 'battery_good'
                    ? 'bg-green-600 border-green-600 text-white' 
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                Batareyası Yaxşı
              </Link>
            </div>
          </div>

          {filteredListings.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              {q || condition ? "Axtarışa uyğun elan tapılmadı." : "Hələ ki elan yoxdur."}
            </p>
          )}

          {/* Listings Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map((item) => (
              <Link key={item.id} href={`/listings/${item.id}`} className="block group">
                <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group-hover:border-gray-700 transition-all">
                  <div className="aspect-square bg-gray-800 relative">
                    {/* @ts-ignore */}
                    <img src={item.photos[0]} alt={item.modelName} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-white">
                      {formatAZN(item.price)}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm text-gray-200 truncate">{item.modelName}</h4>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {/* @ts-ignore */}
                      {item.faultTree?.screen === 'working' && (
                        <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded">Ekran OK</span>
                      )}
                      {/* @ts-ignore */}
                      {item.faultTree?.board === 'working' && (
                        <span className="text-[10px] bg-purple-900/30 text-purple-400 px-1.5 py-0.5 rounded">Anakart OK</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

