const flattenObject = (obj, prefix = "") =>
  Object.keys(obj || {}).reduce((res, k) => {
    const pre = prefix.length ? prefix + "." : "";
    const val = obj[k];

    if (val === null || val === undefined) {
      res[pre + k] = val;
    } else if (Array.isArray(val)) {
      res[pre + k] = val;
    } else if (typeof val === "object") {
      Object.assign(res, flattenObject(val, pre + k));
    } else {
      res[pre + k] = val;
    }

    return res;
  }, {});

function renderCell(value) {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export default function TableRenderer({ dataset }) {
  if (!dataset || !dataset.length) {
    return <p>No data</p>;
  }

  const flatDataset = dataset.map((r) =>
    typeof r === "object" ? flattenObject(r) : r
  );

  const cols = Array.from(
    new Set(flatDataset.flatMap((r) => Object.keys(r)))
  );

  return (
    <div className="overflow-auto max-h-80 border rounded">
      <table className="w-full table-auto border-collapse text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {cols.map((c) => (
              <th key={c} className="p-2 border-b text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {flatDataset.map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {cols.map((c) => (
                <td key={c} className="p-2 border-b">
                  {renderCell(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
