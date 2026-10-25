import { Navigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { useApi } from "@/lib/api";
import NotFoundPage from "./NotFoundPage";

// Đường dẫn ngắn: /collections/gaming, /collections/dell... chuyển về trang danh sách đã lọc
export default function CollectionPage() {
  const { slug = "" } = useParams();
  const { data, error } = useApi<{ query: string }>(`/api/collections/${encodeURIComponent(slug)}`);

  if (error) return <NotFoundPage />;
  if (data) return <Navigate to={`/products?${data.query}`} replace />;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
