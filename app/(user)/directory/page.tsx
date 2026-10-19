import Link from "next/link";
import { SearchX } from "lucide-react";
import { DirectoryControls } from "@/components/directory/directory-controls";
import { DirectoryPagination } from "@/components/directory/directory-pagination";
import { externalUserQuerySchema } from "@/lib/validations";
import { externalUserService, requirePageUser } from "@/services";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePageUser("admin");
  const query = externalUserQuerySchema.parse(await searchParams);
  const page = await externalUserService.list(query);

  const firstResult =
    page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const lastResult = Math.min(page.page * page.pageSize, page.total);

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
          External directory
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
          Find people
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Live data from the DummyJSON REST API, cached for five minutes on the
          server.
        </p>
      </header>

      <DirectoryControls query={query} />

      <p className="mt-5 text-sm text-slate-500" aria-live="polite">
        {page.total
          ? `Showing ${firstResult}–${lastResult} of ${page.total} people`
          : "No people found"}
        {query.q ? ` for “${query.q}”` : ""}
      </p>

      {page.items.length ? (
        <section className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black/25">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left">
              <caption className="sr-only">Directory of people</caption>
              <thead className="border-b border-white/10 bg-black/25 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Person
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Contact
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Company
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Location
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {page.items.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.04]">
                    <th scope="row" className="px-5 py-4 font-normal">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={user.image}
                          alt=""
                          width={44}
                          height={44}
                          loading="lazy"
                          className="size-11 shrink-0 rounded-2xl border border-white/10 bg-slate-800 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">
                            {user.name}
                          </p>
                          <p className="truncate text-sm text-sky-300">
                            @{user.username} · {user.age}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="px-5 py-4">
                      <p className="truncate text-sm text-slate-300">
                        {user.email}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user.phone}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="truncate text-sm text-slate-300">
                        {user.jobTitle}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user.company} · {user.department}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">
                      {user.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {page.items.length ? (
        <DirectoryPagination query={query} page={page} />
      ) : (
        <section className="mt-4 grid min-h-72 place-items-center rounded-3xl border border-dashed border-white/10 px-6 text-center">
          <div>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/5 text-slate-500">
              <SearchX className="size-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-bold">No matching people</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try a different search or reset the filters.
            </p>
            <Link
              href="/directory"
              className="mt-5 inline-flex rounded-xl bg-sky-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-sky-300"
            >
              Reset directory
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
