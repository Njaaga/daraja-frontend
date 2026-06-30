import InfoTooltip from "@/app/components/InfoTooltip";

export default function DataSourceStep({
  datasets,
  selectedDatasets,
  loadingDatasets,
  toggleSelectDataset,
  preview,
  csvNotice,
  excelData,
}) {
  return (
          <div className="mb-4">
            {/* Step 0 - Select Data */}
            <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">
                  Choose dataset(s) or upload Excel / CSV / Google Sheets
                </h3>
                <InfoTooltip
                  align="right"
                  text="Connect APIs, CSV, Excel, or Google Sheets as input datasets for your dashboard."
                />
              </div>

            <div className="mb-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">API Datasets</label>
                {loadingDatasets ? <div>Loading...</div> : (
                  <div className="grid gap-2 max-h-64 overflow-auto">
                    {datasets.map((d) => {
                      const selected = selectedDatasets.find((s) => String(s.id) === String(d.id));
                      return (
                        <button
                          key={d.id}
                          onClick={() => toggleSelectDataset(d.id)}
                          className={`text-left p-2 rounded border ${selected ? "bg-blue-50 border-blue-400" : "bg-white"}`}
                        >
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-xs text-gray-600">{d.description || ""}</div>
                        </button>
                      );
                    })}
                    {datasets.length === 0 && <div className="text-gray-600">No datasets available</div>}
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-1 font-medium">Upload Excel / CSV</label>
                <label className="block mb-1 font-medium">Upload Excel / CSV</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={e => {
                    setExcelFile(e.target.files[0]);
                    handleExcelUpload(e); // optional: still build preview
                  }}
                  className="mb-2"
                />
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    setCSVFile(e.target.files[0]);
                    handleCSVUpload(e); // optional: still build preview
                  }}
                  className="mb-2"
                />
                <div className="mb-2">
                  <label className="block mb-1 font-medium">Google Sheets CSV URL</label>
                  <textarea placeholder="Paste Google Sheets CSV export URL (public)" id="gs-url" className="border p-2 rounded w-full mb-1" />
                  <button onClick={() => {
                    const v = document.getElementById("gs-url").value;
                    handleGoogleSheets(v);
                  }} className="bg-gray-200 px-3 py-1 rounded">Fetch Google Sheets</button>
                  {csvNotice && <div className="text-sm text-red-500 mt-1">{csvNotice}</div>}
                </div>

                <div>
                  <strong>Selected sources:</strong>
                  <ul className="mt-2">
                    {selectedDatasets.map((s) => <li key={s.id} className="text-sm">{s.name}</li>)}
                    {excelData && <li className="text-sm">Uploaded table ({excelData.length} rows)</li>}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-semibold">Live preview (first 10 rows)</h4>
              {loadingPreview ? <div>Building preview...</div> : <TableRenderer dataset={preview.slice(0, 10)} />}
            </div>
          </div>
  );
}
