export default function Alert({
  message = "Alert",
}) {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
      ⚠ {message}
    </div>
  );
}
