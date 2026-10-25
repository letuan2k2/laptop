import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { Loader2 } from "lucide-react";
import { GuestOnly, RequireAdmin, RequireAuth } from "@/lib/auth";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import CollectionPage from "./pages/CollectionPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/checkout/CheckoutPage";
import CheckoutSuccessPage from "./pages/checkout/CheckoutSuccessPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import OrdersPage from "./pages/buyer/OrdersPage";
import FavoritesPage from "./pages/buyer/FavoritesPage";
import SettingsPage from "./pages/buyer/SettingsPage";
import ChatPage from "./pages/chat/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import InvoicePage from "./pages/InvoicePage";
import SupportPage from "./pages/SupportPage";
import PolicyPage from "./pages/PolicyPage";
import OrderLookupPage from "./pages/service/OrderLookupPage";
import WarrantyLookupPage from "./pages/service/WarrantyLookupPage";
import FeedbackPage from "./pages/service/FeedbackPage";
import ShowroomsPage from "./pages/service/ShowroomsPage";
import NotFoundPage from "./pages/NotFoundPage";

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AdminVouchersPage = lazy(() => import("./pages/admin/AdminVouchersPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminChatPage = lazy(() => import("./pages/admin/AdminChatPage"));
const AdminReviewsPage = lazy(() => import("./pages/admin/AdminReviewsPage"));
const AdminFeedbackPage = lazy(() => import("./pages/admin/AdminFeedbackPage"));
const AdminSettingsPage = lazy(() => import("./pages/admin/AdminSettingsPage"));

// Trang quản trị tách thành file JS riêng, chỉ tải khi admin mở
function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

// Bảng định tuyến phía trình duyệt (React Router)
export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Trang công khai */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/collections/:slug" element={<CollectionPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/chinh-sach/:slug" element={<PolicyPage />} />
        <Route path="/tra-cuu-don-hang" element={<OrderLookupPage />} />
        <Route path="/tra-cuu-bao-hanh" element={<WarrantyLookupPage />} />
        <Route path="/gop-y" element={<FeedbackPage />} />
        <Route path="/he-thong-showroom" element={<ShowroomsPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Đăng nhập / đăng ký: đã đăng nhập thì về trang chủ */}
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

        {/* Cần đăng nhập */}
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/checkout/success/:orderId" element={<RequireAuth><CheckoutSuccessPage /></RequireAuth>} />
        <Route path="/buyer/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
        <Route path="/buyer/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
        <Route path="/buyer/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/invoice/:orderId" element={<RequireAuth><InvoicePage /></RequireAuth>} />

        {/* Quản trị: chỉ ADMIN */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="vouchers" element={<AdminVouchersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="chat" element={<AdminChatPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="feedback" element={<AdminFeedbackPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
