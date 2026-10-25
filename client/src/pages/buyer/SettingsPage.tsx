import { Trophy, Coins, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import AddressManagement from "@/components/profile/AddressManagement";
import { useApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";
import { rankForPoints } from "@shared/site";
import { ProfileForm } from "./ProfileForm";

interface Profile {
  name: string;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  points: number;
  rank: string;
}

const NEXT_RANK: Record<string, { name: string; points: number } | null> = {
  BRONZE: { name: "SILVER", points: 2000 },
  SILVER: { name: "GOLD", points: 5000 },
  GOLD: { name: "PLATINUM", points: 10000 },
  PLATINUM: null,
};

export default function BuyerSettingsPage() {
  useTitle("Tài khoản của tôi");
  const { data: profile, reload } = useApi<Profile>("/api/account/profile");
  if (!profile) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-48 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </main>
    );
  }

  const rank = rankForPoints(profile.points);
  const next = NEXT_RANK[rank];

  return (
    <main className="min-h-screen bg-surface text-zinc-900 pb-20">
      <Navbar />

      <div className="container mx-auto px-4 md:px-12 pt-40 md:pt-44 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-black">Tài khoản của tôi</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{profile.email}</p>
        </div>

        {/* Hạng thành viên */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0b1f3a] to-primary text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Hạng thành viên</p>
              <p className="text-2xl font-black">{rank}</p>
            </div>
          </div>
          <div className="md:text-right">
            <p className="flex md:justify-end items-center gap-1.5 font-black text-lg">
              <Coins className="w-5 h-5 text-yellow-300" /> {profile.points.toLocaleString()} điểm
            </p>
            <p className="text-xs text-white/70 font-medium">
              {next
                ? `Còn ${(next.points - profile.points).toLocaleString()} điểm để lên hạng ${next.name} (1 điểm = 10.000đ mua hàng)`
                : "Bạn đang ở hạng cao nhất"}
            </p>
          </div>
        </div>

        <ProfileForm user={{ name: profile.name, phoneNumber: profile.phoneNumber, address: profile.address }} onSaved={reload} />

        <AddressManagement />
      </div>
    </main>
  );
}
