import { useState } from "react";

export default function useDashboardBuilder() {
  const [dashboardName, setDashboardName] = useState("");
  const [dashboardId, setDashboardId] = useState(null);

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasets, setSelectedDatasets] = useState([]); // dataset objects

  const [datasetRows, setDatasetRows] = useState({}); // id => rows[]
  const [datasetFields, setDatasetFields] = useState({}); // id => [fields]

  const [selectedFields, setSelectedFields] = useState({});

  const [filters, setFilters] = useState([]);

  return {
    dashboardName,
    setDashboardName,

    dashboardId,
    setDashboardId,

    datasets,
    setDatasets,

    selectedDatasets,
    setSelectedDatasets,

    datasetRows,
    setDatasetRows,
    
    datasetFields,
    setDatasetFields,
  
    selectedFields,
    setSelectedFields,

    filters,
    setFilters,
  };
}
