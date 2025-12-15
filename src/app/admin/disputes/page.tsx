import { db } from "@/db";
import { disputes, orders, listings, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDisputesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // In a real app, check for session.user.role === 'admin'
  // For now, we assume access is allowed or we can add a check if we had a way to set roles.

  const openDisputes = await db
    .select({
      id: disputes.id,
      reason: disputes.reason,
      status: disputes.status,
      createdAt: disputes.createdAt,
      orderId: orders.id,
      amount: orders.amount,
      buyerName: user.name,
      listingModel: listings.modelName,
    })
    .from(disputes)
    .innerJoin(orders, eq(disputes.orderId, orders.id))
    .innerJoin(listings, eq(orders.listingId, listings.id))
    .innerJoin(user, eq(orders.buyerId, user.id))
    .where(eq(disputes.status, "open"))
    .orderBy(desc(disputes.createdAt));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin: Open Disputes</h1>
      
      {openDisputes.length === 0 ? (
        <p className="text-gray-500">No open disputes found.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {openDisputes.map((dispute) => (
              <li key={dispute.id}>
                <Link href={`/admin/disputes/${dispute.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        Order #{dispute.orderId.slice(0, 8)}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {dispute.status}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Buyer: {dispute.buyerName}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Item: {dispute.listingModel}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Opened on {new Date(dispute.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
