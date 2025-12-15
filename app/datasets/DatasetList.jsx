import Link from "next/link";

async function getDatasets() {
  try {
    const res = await fetch("http://localhost:8000/api/datasets/", {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch datasets:", res.statusText);
      return [];
    }

    const data = await res.json();

    // Handle DRF paginated or plain array response
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;

    return [];
  } catch (err) {
    console.error("Error fetching datasets:", err);
    return [];
  }
}

export default async function Page() {
  const datasets = await getDatasets();

  return (
    <div className="p-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-semibold">Datasets</h1>
        <Link
          href="/datasets/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + New Dataset
        </Link>
      </div>

      {datasets.length === 0 ? (
        <div className="bg-white shadow rounded-xl p-6 text-gray-600">
          No datasets found.
        </div>
      ) : (
        <div className="bg-white shadow rounded-xl p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Name</th>
                <th className="p-3">API Source</th>
                <th className="p-3">Endpoint</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {datasets.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{d.name}</td>
                  <td className="p-3">{d.api_source_name}</td>
                  <td className="p-3">{d.endpoint}</td>
                  <td className="p-3">
                    <Link href={`/datasets/${d.id}`} className="text-blue-600">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
