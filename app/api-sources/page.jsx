import ApiSourceTable from "@/app/components/ApiSourceTable";
import Layout from "@/app/components/Layout";

export default function Page() {
  return (
     <Layout>
    <div className="p-10">
      <ApiSourceTable />
    </div>
    </Layout>
  );
}
