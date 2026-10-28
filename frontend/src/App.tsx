import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestOnly, RequireAuth } from './auth/guards';
import { AppLayout } from './components/AppLayout';
import { PublicLayout } from './components/PublicLayout';
import AdminMeals from './pages/admin/AdminMeals';
import AdminOrders from './pages/admin/AdminOrders';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import Assistant from './pages/customer/Assistant';
import Dashboard from './pages/customer/Dashboard';
import Orders from './pages/customer/Orders';
import Profile from './pages/customer/Profile';
import Subscribe from './pages/customer/Subscribe';
import Subscriptions from './pages/customer/Subscriptions';
import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Plans from './pages/Plans';
import Register from './pages/Register';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="plans" element={<Plans />} />
        <Route element={<GuestOnly />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="app" element={<RequireAuth role="CUSTOMER" />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="subscribe/:planId" element={<Subscribe />} />
          <Route path="orders" element={<Orders />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
      </Route>

      <Route path="admin" element={<RequireAuth role="ADMIN" />}>
        <Route element={<AppLayout />}>
          <Route index element={<AdminOrders />} />
          <Route path="meals" element={<AdminMeals />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
