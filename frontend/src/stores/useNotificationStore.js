import { create } from "zustand";
import { analyticsService } from "../services/analyticsService";

export const useNotificationStore = create((set, get) => ({
  summary: null,
  predictive: [],
  alerts: {
    down: 0,
    maintenance: 0,
    overdue: 0,
    expired: 0,
    total: 0,
  },
  loading: true,
  isRefreshing: false,
  lastUpdated: null,
  isModalOpen: false,

  setModalOpen: (open) => set({ isModalOpen: open }),

  fetchAlerts: async (silent = false) => {
    if (!silent) set({ isRefreshing: true });
    try {
      const [sumRes, predRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getPredictive().catch(() => ({ data: [] })),
      ]);

      const sumData = sumRes?.data ?? {};
      const predData = predRes?.data ?? [];

      const downCount = sumData.by_status?.down ?? sumData.down_devices?.length ?? 0;
      const upcomingCount = sumData.upcoming_maintenances?.length ?? 0;
      const overdueCount = sumData.overdue_maintenances?.length ?? 0;
      const expiredCount = sumData.warranty_expired ?? 0;
      const total = downCount + upcomingCount + overdueCount;

      set({
        summary: sumData,
        predictive: predData,
        alerts: {
          down: downCount,
          maintenance: upcomingCount + overdueCount,
          upcoming: upcomingCount,
          overdue: overdueCount,
          expired: expiredCount,
          total: total,
        },
        loading: false,
        isRefreshing: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("Gagal sinkronisasi notifikasi realtime:", err);
      set({ loading: false, isRefreshing: false });
    }
  },
}));

// Helper function yang dapat dipanggil dari halaman manapun setelah operasi CRUD
export const refreshAlerts = () => {
  useNotificationStore.getState().fetchAlerts(true);
  window.dispatchEvent(new CustomEvent("infraverse:refresh-alerts"));
};

export default useNotificationStore;
