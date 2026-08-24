if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\pages\Maintenance","src\pages\Profile","src\pages\Assets","src\services" | Out-Null

Write-Host "Menulis MaintenanceService..." -ForegroundColor Cyan

@'
import api from "./api";
export const maintenanceService = {
  getAll:  (params) => api.get("/maintenances", { params }),
  create:  (data)   => api.post("/maintenances", data),
  update:  (id, data) => api.patch(`/maintenances/${id}`, data),
  remove:  (id)     => api.delete(`/maintenances/${id}`),
};
'@ | Set-Content -Path "src\services\maintenanceService.js" -Encoding ascii

@'
import api from "./api";
export const profileService = {
  update:         (data) => api.patch("/profile", data),
  changePassword: (data) => api.patch("/profile/password", data),
};
'@ | Set-Content -Path "src\services\profileService.js" -Encoding ascii

Write-Host "Menulis MaintenancePage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { maintenanceService } from "../../services/maintenanceService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import { SkeletonTable } from "../../components/shared/Skeleton.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { deviceService } from "../../services/deviceService";

const STATUS_MAP = {
  scheduled:   { label:"Terjadwal",   cls:"bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label:"Berlangsung", cls:"bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  completed:   { label:"Selesai",     cls:"bg-green-500/10 text-green-400 border-green-500/20" },
  cancelled:   { label:"Dibatalkan",  cls:"bg-slate-500/10 text-slate-400 border-slate-500/20" },
};
const TYPE_MAP = { preventive:"Preventif", corrective:"Korektif" };

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [items, setItems]       = useState([]);
  const [devices, setDevices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving]     = useState(false);

  const emptyForm = { device_id:"", type:"preventive", scheduled_date:"", notes:"", status:"scheduled" };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [m, d] = await Promise.all([
        maintenanceService.getAll(),
        deviceService.getAll(),
      ]);
      setItems(m.data);
      setDevices(d.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      device_id:      item.device_id ?? "",
      type:           item.type,
      scheduled_date: item.scheduled_date?.substring(0,10) ?? "",
      notes:          item.notes ?? "",
      status:         item.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await maintenanceService.update(editing.id, form);
        toast.success("Jadwal maintenance diperbarui.");
      } else {
        await maintenanceService.create(form);
        toast.success("Jadwal maintenance ditambahkan.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await maintenanceService.remove(deleting.id);
      toast.success("Jadwal dihapus.");
      setDeleting(null);
      load();
    } catch {
      toast.error("Gagal menghapus.");
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await maintenanceService.update(item.id, { ...item, status: newStatus });
      toast.success(`Status diubah ke ${STATUS_MAP[newStatus]?.label}.`);
      load();
    } catch {
      toast.error("Gagal mengubah status.");
    }
  };

  const counts = {
    all:         items.length,
    scheduled:   items.filter(i => i.status === "scheduled").length,
    in_progress: items.filter(i => i.status === "in_progress").length,
    completed:   items.filter(i => i.status === "completed").length,
  };

  return (
    <div className="p-8">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Maintenance" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Maintenance</h2>
          <p className="text-slate-400 text-sm mt-1">Jadwalkan dan pantau maintenance perangkat infrastruktur</p>
        </div>
        {canWrite && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            + Tambah Jadwal
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          ["all","Semua"],
          ["scheduled","Terjadwal"],
          ["in_progress","Berlangsung"],
          ["completed","Selesai"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              filter === key
                ? "bg-blue-600 text-white border-blue-600"
                : "text-slate-400 border-slate-700 hover:border-slate-500"
            }`}>
            {label}
            <span className="ml-2 text-xs opacity-70">({counts[key] ?? 0})</span>
          </button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={5} /> : filtered.length === 0 ? (
        <EmptyState
          icon="🔧"
          title="Belum ada jadwal maintenance"
          description="Tambah jadwal maintenance untuk memantau kondisi perangkat secara berkala."
          action={canWrite ? { label:"+ Tambah Jadwal", onClick: openAdd } : null}
        />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Perangkat</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Catatan</th>
                {canWrite && <th className="px-4 py-3 font-medium">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const s = STATUS_MAP[item.status] ?? { label: item.status, cls:"" };
                const isOverdue = item.status === "scheduled"
                  && new Date(item.scheduled_date) < new Date();
                return (
                  <tr key={item.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${isOverdue ? "bg-red-500/5" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{item.device?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{item.device?.type}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        item.type === "preventive"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }`}>
                        {TYPE_MAP[item.type] ?? item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`text-sm ${isOverdue ? "text-red-400 font-medium" : "text-slate-300"}`}>
                        {item.scheduled_date}
                        {isOverdue && <span className="ml-1 text-xs">(Terlambat!)</span>}
                      </p>
                      {item.completed_date && (
                        <p className="text-xs text-green-400">Selesai: {item.completed_date}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canWrite ? (
                        <select value={item.status}
                          onChange={e => handleStatusChange(item, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer focus:outline-none ${s.cls}`}>
                          {Object.entries(STATUS_MAP).map(([k, v]) => (
                            <option key={k} value={k} className="bg-slate-800 text-slate-100">{v.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded border ${s.cls}`}>{s.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">
                      <p className="truncate">{item.notes ?? "—"}</p>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(item)}
                            className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600">
                            Edit
                          </button>
                          <button onClick={() => setDeleting(item)}
                            className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Jadwal" : "Tambah Jadwal Maintenance"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Perangkat</label>
              <select required value={form.device_id}
                onChange={e => setForm({...form, device_id: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                <option value="">Pilih perangkat</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipe</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                  <option value="preventive">Preventif</option>
                  <option value="corrective">Korektif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                  {Object.entries(STATUS_MAP).map(([k,v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tanggal Terjadwal</label>
              <input type="date" required value={form.scheduled_date}
                onChange={e => setForm({...form, scheduled_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Catatan</label>
              <textarea rows={3} value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Deskripsi pekerjaan maintenance..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Hapus jadwal maintenance untuk "${deleting.device?.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Maintenance\MaintenancePage.jsx" -Encoding ascii

Write-Host "Menulis AssetDetailPage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonText } from "../../components/shared/Skeleton.jsx";
import Modal from "../../components/shared/Modal.jsx";

const TYPE_ICON = { router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥", access_point:"📡", ups:"🔋", other:"📦" };
const AGE_COLOR = (age) => {
  if (!age) return "text-slate-400";
  if (age < 3)  return "text-green-400";
  if (age < 5)  return "text-yellow-400";
  return "text-red-400";
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [device, setDevice]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName]     = useState("");
  const [docFile, setDocFile]     = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await deviceService.getOne(id);
      setDevice(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("name", docName || docFile.name);
      fd.append("document", docFile);
      fd.append("device_id", id);
      await import("../../services/api.js").then(m =>
        m.default.post(`/devices/${id}/documents`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      );
      toast.success("Dokumen berhasil diupload.");
      setShowDocModal(false);
      setDocName(""); setDocFile(null);
      load();
    } catch {
      toast.error("Gagal upload dokumen.");
    } finally { setUploading(false); }
  };

  if (loading) return (
    <div className="p-8">
      <div className="h-6 bg-slate-700 rounded w-48 animate-pulse mb-6" />
      <SkeletonText lines={6} />
    </div>
  );

  if (!device) return (
    <div className="p-8 text-red-400">Perangkat tidak ditemukan.</div>
  );

  const location = [
    device.rack?.room?.floor?.building?.name,
    device.rack?.room?.floor?.name,
    device.rack?.room?.name,
    device.rack?.name,
  ].filter(Boolean).join(" → ");

  const tabs = [
    { key:"info",        label:"Informasi" },
    { key:"connections", label:`Koneksi (${(device.source_connections?.length ?? 0) + (device.target_connections?.length ?? 0)})` },
    { key:"maintenance", label:`Maintenance (${device.maintenances?.length ?? 0})` },
    { key:"documents",   label:`Dokumen (${device.documents?.length ?? 0})` },
  ];

  return (
    <div className="p-8">
      <Breadcrumb items={[
        { label:"Dashboard", href:"/dashboard" },
        { label:"Aset", href:"/assets" },
        { label: device.name },
      ]} />

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          {TYPE_ICON[device.type] ?? "📦"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-100">{device.name}</h2>
            <StatusBadge status={device.status} />
            {device.is_under_warranty
              ? <span className="text-xs px-2 py-0.5 rounded border bg-green-500/10 text-green-400 border-green-500/20">✓ Garansi Aktif</span>
              : device.warranty_expiry
                ? <span className="text-xs px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">✗ Garansi Habis</span>
                : null
            }
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {device.vendor} {device.model}
            {device.serial_number && <span className="ml-2 text-slate-500">· S/N: {device.serial_number}</span>}
          </p>
          <p className="text-slate-500 text-xs mt-1">{location || "Tidak di rack"}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/assets")}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg">
            ← Kembali
          </button>
          {canWrite && (
            <button onClick={() => navigate(`/assets?edit=${device.id}`)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Detail Perangkat</h3>
            <dl className="space-y-3">
              {[
                ["Tipe",          device.type?.replace("_"," ") ?? "—"],
                ["IP Address",    device.ip_address ?? "—"],
                ["MAC Address",   device.mac_address ?? "—"],
                ["Serial Number", device.serial_number ?? "—"],
                ["Vendor",        device.vendor ?? "—"],
                ["Model",         device.model ?? "—"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-sm text-slate-200 font-mono">{val}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Informasi Aset</h3>
              <dl className="space-y-3">
                {[
                  ["Tanggal Beli",    device.purchase_date ?? "—"],
                  ["Garansi Sampai",  device.warranty_expiry ?? "—"],
                  ["Posisi Rack",     device.rack_position ? `U${device.rack_position}` : "—"],
                  ["Ukuran Rack",     device.rack_units ? `${device.rack_units}U` : "—"],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-sm text-slate-200">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Usia Perangkat</h3>
              <div className="flex items-end gap-2">
                <span className={`text-4xl font-bold ${AGE_COLOR(device.age_in_years)}`}>
                  {device.age_in_years ?? "—"}
                </span>
                {device.age_in_years && <span className="text-slate-400 text-sm mb-1">tahun</span>}
              </div>
              {device.age_in_years && (
                <div className="mt-3 bg-slate-700 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((device.age_in_years / 10) * 100, 100)}%`,
                      background: device.age_in_years < 3 ? "#22c55e" : device.age_in_years < 5 ? "#eab308" : "#ef4444",
                    }} />
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2">
                {device.age_in_years < 3 ? "✓ Kondisi baik"
                 : device.age_in_years < 5 ? "⚠ Perlu diperhatikan"
                 : "⛔ Pertimbangkan penggantian"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connections tab */}
      {activeTab === "connections" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Arah</th>
                <th className="px-4 py-3 font-medium">Perangkat</th>
                <th className="px-4 py-3 font-medium">Tipe Kabel</th>
                <th className="px-4 py-3 font-medium">Port</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...(device.source_connections ?? []).map(c => ({ ...c, dir:"→ Ke", peer: c.target_device })),
                ...(device.target_connections ?? []).map(c => ({ ...c, dir:"← Dari", peer: c.source_device })),
              ].map((c, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3 text-xs text-slate-400">{c.dir}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{c.peer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 capitalize">{c.connection_type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">
                    {c.port_source} → {c.port_target}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
              {((device.source_connections?.length ?? 0) + (device.target_connections?.length ?? 0)) === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Tidak ada koneksi terdaftar</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Maintenance tab */}
      {activeTab === "maintenance" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Teknisi</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {(device.maintenances ?? []).map((m, i) => (
                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      m.type === "preventive"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    }`}>
                      {m.type === "preventive" ? "Preventif" : "Korektif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{m.scheduled_date}</td>
                  <td className="px-4 py-3 text-slate-400">{m.technician?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      m.status === "completed" ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : m.status === "in_progress" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">
                    <p className="truncate">{m.notes ?? "—"}</p>
                  </td>
                </tr>
              ))}
              {(device.maintenances?.length ?? 0) === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Belum ada riwayat maintenance</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Documents tab */}
      {activeTab === "documents" && (
        <div>
          {canWrite && (
            <div className="mb-4">
              <button onClick={() => setShowDocModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                + Upload Dokumen
              </button>
            </div>
          )}
          {(device.documents?.length ?? 0) === 0 ? (
            <EmptyState icon="📄" title="Belum ada dokumen"
              description="Upload manual, datasheet, atau dokumen terkait perangkat ini."
              action={canWrite ? { label:"+ Upload Dokumen", onClick:() => setShowDocModal(true) } : null} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {device.documents.map((doc) => (
                <div key={doc.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/40 transition-colors">
                  <div className="text-3xl flex-shrink-0">📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-100 text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">{doc.type ?? "Dokumen"}</p>
                  </div>
                  <a href={`/storage/${doc.file_path}`} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0">
                    Buka →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDocModal && (
        <Modal title="Upload Dokumen" onClose={() => setShowDocModal(false)}>
          <form onSubmit={handleUploadDoc} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Dokumen</label>
              <input value={docName} onChange={e => setDocName(e.target.value)}
                placeholder="Contoh: Manual Cisco Catalyst 9300"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">File (PDF, gambar)</label>
              <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setDocFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:text-xs" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowDocModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={uploading}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
                {uploading ? "Mengupload..." : "Upload"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Assets\AssetDetailPage.jsx" -Encoding ascii

Write-Host "Menulis ProfilePage..." -ForegroundColor Cyan

@'
import { useState } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../stores/authStore";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import api from "../../services/api.js";

const ROLE_BADGE = {
  admin:   "bg-red-500/20 text-red-400 border-red-500/30",
  teknisi: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  viewer:  "bg-green-500/20 text-green-400 border-green-500/30",
};
const ROLE_LABEL = { admin:"Administrator", teknisi:"Teknisi IT", viewer:"Viewer" };

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();

  const [profileForm, setProfileForm] = useState({ name: user?.name ?? "", phone: user?.phone ?? "" });
  const [passForm, setPassForm]       = useState({ current_password:"", password:"", password_confirmation:"" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass]       = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch("/profile", profileForm);
      setAuth(res.data.user, token);
      toast.success("Profil berhasil diperbarui.");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Gagal memperbarui profil.");
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.password !== passForm.password_confirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setSavingPass(true);
    try {
      await api.patch("/profile/password", passForm);
      toast.success("Password berhasil diubah.");
      setPassForm({ current_password:"", password:"", password_confirmation:"" });
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat()[0] : (err.response?.data?.message ?? "Gagal mengubah password."));
    } finally { setSavingPass(false); }
  };

  return (
    <div className="p-8 max-w-3xl">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Profil" }]} />

      <h2 className="text-2xl font-bold text-slate-100 mb-8">Profil Akun</h2>

      {/* Avatar & role */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-100">{user?.name}</h3>
          <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
          <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full border font-medium capitalize ${ROLE_BADGE[user?.role] ?? ""}`}>
            {ROLE_LABEL[user?.role] ?? user?.role}
          </span>
        </div>
      </div>

      {/* Edit profile */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Informasi Profil</h3>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
            <input required value={profileForm.name}
              onChange={e => setProfileForm({...profileForm, name: e.target.value})}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input value={user?.email} disabled
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-500 text-sm cursor-not-allowed" />
            <p className="text-xs text-slate-600 mt-1">Email tidak dapat diubah.</p>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nomor Telepon</label>
            <input value={profileForm.phone}
              onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
              placeholder="+62..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <button type="submit" disabled={savingProfile}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Ganti Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label:"Password Saat Ini", key:"current_password" },
            { label:"Password Baru (min. 8 karakter)", key:"password" },
            { label:"Konfirmasi Password Baru", key:"password_confirmation" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input type="password" required value={passForm[key]}
                onChange={e => setPassForm({...passForm, [key]: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={savingPass}
            className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {savingPass ? "Mengubah..." : "Ganti Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Profile\ProfilePage.jsx" -Encoding ascii

Write-Host "Update AppRoutes (tambah Maintenance, AssetDetail, Profile)..." -ForegroundColor Cyan

@'
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import BuildingPage from "../pages/Building/BuildingPage.jsx";
import BuildingDetailPage from "../pages/Building/BuildingDetailPage.jsx";
import AssetsPage from "../pages/Assets/AssetsPage.jsx";
import AssetDetailPage from "../pages/Assets/AssetDetailPage.jsx";
import MappingPage from "../pages/Mapping/MappingPage.jsx";
import SimulationPage from "../pages/Simulation/SimulationPage.jsx";
import DigitalTwinPage from "../pages/DigitalTwin/DigitalTwinPage.jsx";
import MaintenancePage from "../pages/Maintenance/MaintenancePage.jsx";
import ProfilePage from "../pages/Profile/ProfilePage.jsx";
import MainLayout from "../components/layout/MainLayout.jsx";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard"      element={<DashboardPage />} />
        <Route path="buildings"      element={<BuildingPage />} />
        <Route path="buildings/:id"  element={<BuildingDetailPage />} />
        <Route path="assets"         element={<AssetsPage />} />
        <Route path="assets/:id"     element={<AssetDetailPage />} />
        <Route path="mapping"        element={<MappingPage />} />
        <Route path="simulation"     element={<SimulationPage />} />
        <Route path="digital-twin"   element={<DigitalTwinPage />} />
        <Route path="maintenance"    element={<MaintenancePage />} />
        <Route path="profile"        element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
'@ | Set-Content -Path "src\routes\AppRoutes.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Polish-2 siap." -ForegroundColor Green
Write-Host "Lanjut: tambah endpoint backend untuk Maintenance & Profile, lalu polish-3.ps1" -ForegroundColor Yellow