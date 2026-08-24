if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\services","src\pages\Building","src\pages\Assets","src\components\shared" | Out-Null

Write-Host "Menulis services..." -ForegroundColor Cyan

@'
import api from "./api";

export const buildingService = {
  getAll: ()                        => api.get("/buildings"),
  getOne: (id)                      => api.get(`/buildings/${id}`),
  create: (data)                    => api.post("/buildings", data),
  update: (id, data)                => api.post(`/buildings/${id}`, data),
  remove: (id)                      => api.delete(`/buildings/${id}`),

  getFloors: (buildingId)           => api.get(`/buildings/${buildingId}/floors`),
  createFloor: (buildingId, data)   => api.post(`/buildings/${buildingId}/floors`, data),
  updateFloor: (buildingId, floorId, data) =>
    api.post(`/buildings/${buildingId}/floors/${floorId}`, data),
  deleteFloor: (buildingId, floorId) =>
    api.delete(`/buildings/${buildingId}/floors/${floorId}`),

  getRooms: (floorId)               => api.get(`/floors/${floorId}/rooms`),
  createRoom: (floorId, data)       => api.post(`/floors/${floorId}/rooms`, data),
  updateRoom: (floorId, roomId, data) =>
    api.post(`/floors/${floorId}/rooms/${roomId}`, data),
  deleteRoom: (floorId, roomId)     =>
    api.delete(`/floors/${floorId}/rooms/${roomId}`),

  getRacks: (roomId)                => api.get(`/rooms/${roomId}/racks`),
  createRack: (roomId, data)        => api.post(`/rooms/${roomId}/racks`, data),
  updateRack: (roomId, rackId, data) =>
    api.post(`/rooms/${roomId}/racks/${rackId}`, data),
  deleteRack: (roomId, rackId)      =>
    api.delete(`/rooms/${roomId}/racks/${rackId}`),
};
'@ | Set-Content -Path "src\services\buildingService.js" -Encoding ascii

@'
import api from "./api";

export const deviceService = {
  getAll:    (params)  => api.get("/devices", { params }),
  getOne:    (id)      => api.get(`/devices/${id}`),
  getByRack: (rackId)  => api.get(`/racks/${rackId}/devices`),
  create:    (data)    => api.post("/devices", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update:    (id, data) => api.post(`/devices/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  remove:    (id)      => api.delete(`/devices/${id}`),
};
'@ | Set-Content -Path "src\services\deviceService.js" -Encoding ascii

Write-Host "Menulis shared components..." -ForegroundColor Cyan

@'
export default function StatusBadge({ status }) {
  const map = {
    active:      { label: "Aktif",       cls: "bg-green-500/20 text-green-400 border-green-500/30" },
    inactive:    { label: "Nonaktif",    cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    maintenance: { label: "Maintenance", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    down:        { label: "Down",        cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/20 text-slate-400" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}
'@ | Set-Content -Path "src\components\shared\StatusBadge.jsx" -Encoding ascii

@'
export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\Modal.jsx" -Encoding ascii

@'
export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <p className="text-slate-100 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\ConfirmDialog.jsx" -Encoding ascii

Write-Host "Menulis halaman Building..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";

export default function BuildingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [form, setForm]           = useState({ name: "", location: "", total_floors: 1, description: "" });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const load = async () => {
    try {
      const res = await buildingService.getAll();
      setBuildings(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", location: "", total_floors: 1, description: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ name: b.name, location: b.location ?? "", total_floors: b.total_floors, description: b.description ?? "" });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (editing) {
        await buildingService.update(editing.id, fd);
      } else {
        await buildingService.create(fd);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await buildingService.remove(deleting.id);
    setDeleting(null);
    load();
  };

  if (loading) return <div className="p-8 text-slate-400">Memuat data gedung...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Gedung</h2>
          <p className="text-slate-400 text-sm mt-1">{buildings.length} gedung terdaftar</p>
        </div>
        {canWrite && (
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Tambah Gedung
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {buildings.map((b) => (
          <div
            key={b.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">🏢</div>
              {canWrite && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(b)}
                    className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(b)}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-slate-100 text-lg">{b.name}</h3>
            <p className="text-slate-400 text-sm mt-1">{b.location ?? "—"}</p>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
              <div className="text-center">
                <p className="text-xl font-bold text-blue-400">{b.total_floors}</p>
                <p className="text-xs text-slate-400">Lantai</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-400">{b.floors_count ?? 0}</p>
                <p className="text-xs text-slate-400">Terdaftar</p>
              </div>
              <button
                onClick={() => navigate(`/buildings/${b.id}`)}
                className="ml-auto text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                Detail →
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Gedung" : "Tambah Gedung"} onClose={() => setShowForm(false)}>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { label: "Nama Gedung", key: "name", type: "text", required: true },
              { label: "Lokasi", key: "location", type: "text" },
              { label: "Jumlah Lantai", key: "total_floors", type: "number" },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-sm text-slate-300 mb-1">{label}</label>
                <input
                  type={type}
                  required={required}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm text-slate-300 mb-1">Deskripsi</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Hapus gedung "${deleting.name}"? Semua lantai, ruangan, dan rack di dalamnya juga akan terhapus.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Building\BuildingPage.jsx" -Encoding ascii

@'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";

export default function BuildingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";

  const [building, setBuilding] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [loading, setLoading]         = useState(true);

  const [floorModal, setFloorModal]   = useState(false);
  const [roomModal, setRoomModal]     = useState(false);
  const [rackModal, setRackModal]     = useState(false);
  const [delTarget, setDelTarget]     = useState(null);

  const [floorForm, setFloorForm] = useState({ name: "", floor_number: "" });
  const [roomForm, setRoomForm]   = useState({ name: "", type: "server_room" });
  const [rackForm, setRackForm]   = useState({ name: "", position: "", total_u: 42 });
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    const res = await buildingService.getOne(id);
    setBuilding(res.data);
    if (res.data.floors?.length > 0 && !activeFloor) {
      setActiveFloor(res.data.floors[0]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const floors  = building?.floors ?? [];
  const rooms   = activeFloor?.rooms ?? [];
  const racks   = activeRoom?.racks ?? [];

  const roomTypes = ["server_room","office","classroom","lab","storage","other"];

  const saveFloor = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await buildingService.createFloor(id, { ...floorForm, building_id: id });
      setFloorModal(false); load();
    } finally { setSaving(false); }
  };

  const saveRoom = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await buildingService.createRoom(activeFloor.id, { ...roomForm, floor_id: activeFloor.id });
      setRoomModal(false); load();
    } finally { setSaving(false); }
  };

  const saveRack = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await buildingService.createRack(activeRoom.id, { ...rackForm, room_id: activeRoom.id });
      setRackModal(false); load();
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-slate-400">Memuat...</div>;
  if (!building) return <div className="p-8 text-red-400">Gedung tidak ditemukan.</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/buildings")} className="text-slate-400 hover:text-slate-100 text-sm">← Kembali</button>
        <span className="text-slate-600">/</span>
        <h2 className="text-xl font-bold text-slate-100">{building.name}</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">{building.location}</span>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lantai */}
        <div className="col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Lantai</h3>
            {canWrite && <button onClick={() => setFloorModal(true)} className="text-xs text-blue-400 hover:text-blue-300">+ Tambah</button>}
          </div>
          <div className="space-y-1">
            {floors.map((f) => (
              <button
                key={f.id}
                onClick={() => { setActiveFloor(f); setActiveRoom(null); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeFloor?.id === f.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700"}`}
              >
                {f.name}
              </button>
            ))}
            {floors.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Belum ada lantai</p>}
          </div>
        </div>

        {/* Ruangan */}
        <div className="col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Ruangan</h3>
            {canWrite && activeFloor && <button onClick={() => setRoomModal(true)} className="text-xs text-blue-400 hover:text-blue-300">+ Tambah</button>}
          </div>
          <div className="space-y-1">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveRoom(r)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeRoom?.id === r.id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700"}`}
              >
                <span>{r.name}</span>
                <span className="block text-xs opacity-60 capitalize">{r.type.replace("_"," ")}</span>
              </button>
            ))}
            {rooms.length === 0 && <p className="text-xs text-slate-500 text-center py-4">{activeFloor ? "Belum ada ruangan" : "Pilih lantai dulu"}</p>}
          </div>
        </div>

        {/* Rack */}
        <div className="col-span-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Rack di {activeRoom?.name ?? "—"}</h3>
            {canWrite && activeRoom && <button onClick={() => setRackModal(true)} className="text-xs text-blue-400 hover:text-blue-300">+ Tambah Rack</button>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {racks.map((rack) => (
              <div key={rack.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                <div className="text-2xl mb-2">🗄</div>
                <p className="font-medium text-slate-100 text-sm">{rack.name}</p>
                <p className="text-xs text-slate-400 mt-1">Posisi: {rack.position ?? "—"} · {rack.total_u}U</p>
                <button
                  onClick={() => navigate(`/assets?rack_id=${rack.id}`)}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300"
                >
                  Lihat Perangkat →
                </button>
              </div>
            ))}
            {racks.length === 0 && <p className="text-xs text-slate-500 col-span-2 text-center py-6">{activeRoom ? "Belum ada rack" : "Pilih ruangan dulu"}</p>}
          </div>
        </div>
      </div>

      {floorModal && (
        <Modal title="Tambah Lantai" onClose={() => setFloorModal(false)}>
          <form onSubmit={saveFloor} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nama Lantai</label>
              <input required value={floorForm.name} onChange={e => setFloorForm({...floorForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nomor Lantai</label>
              <input type="number" required value={floorForm.floor_number} onChange={e => setFloorForm({...floorForm, floor_number: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFloorModal(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      {roomModal && (
        <Modal title="Tambah Ruangan" onClose={() => setRoomModal(false)}>
          <form onSubmit={saveRoom} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nama Ruangan</label>
              <input required value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tipe</label>
              <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {roomTypes.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setRoomModal(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      {rackModal && (
        <Modal title="Tambah Rack" onClose={() => setRackModal(false)}>
          <form onSubmit={saveRack} className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Nama Rack</label>
              <input required value={rackForm.name} onChange={e => setRackForm({...rackForm, name: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Posisi (misal: A1)</label>
              <input value={rackForm.position} onChange={e => setRackForm({...rackForm, position: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Total U</label>
              <input type="number" value={rackForm.total_u} onChange={e => setRackForm({...rackForm, total_u: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setRackModal(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Building\BuildingDetailPage.jsx" -Encoding ascii

Write-Host "Menulis halaman Assets..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";

const DEVICE_TYPES = ["router","switch","firewall","server","access_point","ups","other"];
const DEVICE_STATUSES = ["active","inactive","maintenance","down"];

const typeIcon = { router:"🔀", switch:"🔌", firewall:"🛡", server:"🖥", access_point:"📡", ups:"🔋", other:"📦" };

export default function AssetsPage() {
  const { user } = useAuthStore();
  const canWrite = user?.role === "admin" || user?.role === "teknisi";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [devices, setDevices]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterType, setFilterType]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const emptyForm = { rack_id:"", name:"", type:"router", vendor:"", model:"", serial_number:"", ip_address:"", mac_address:"", status:"active", purchase_date:"", warranty_expiry:"", rack_position:"", rack_units:1 };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await deviceService.getAll({ search, type: filterType, status: filterStatus });
      setDevices(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, filterType, filterStatus]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(""); setShowForm(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      rack_id: d.rack_id ?? "", name: d.name, type: d.type, vendor: d.vendor ?? "",
      model: d.model ?? "", serial_number: d.serial_number ?? "", ip_address: d.ip_address ?? "",
      mac_address: d.mac_address ?? "", status: d.status,
      purchase_date: d.purchase_date ? d.purchase_date.substring(0,10) : "",
      warranty_expiry: d.warranty_expiry ? d.warranty_expiry.substring(0,10) : "",
      rack_position: d.rack_position ?? "", rack_units: d.rack_units ?? 1,
    });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      if (editing) await deviceService.update(editing.id, fd);
      else await deviceService.create(fd);
      setShowForm(false); load();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join(" ") : (err.response?.data?.message ?? "Terjadi kesalahan."));
    } finally { setSaving(false); }
  };

  const handleDelete = async () => { await deviceService.remove(deleting.id); setDeleting(null); load(); };

  const warrantyBadge = (d) => {
    if (!d.warranty_expiry) return null;
    return d.is_under_warranty
      ? <span className="text-xs text-green-400">✓ Garansi aktif</span>
      : <span className="text-xs text-red-400">✗ Garansi habis</span>;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Aset</h2>
          <p className="text-slate-400 text-sm mt-1">{devices.length} perangkat ditemukan</p>
        </div>
        {canWrite && (
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
            + Tambah Perangkat
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text" placeholder="Cari nama, IP, serial..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 w-64"
        />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Semua Tipe</option>
          {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500">
          <option value="">Semua Status</option>
          {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">Perangkat</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
              <th className="px-4 py-3 font-medium">Lokasi</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Garansi</th>
              {canWrite && <th className="px-4 py-3 font-medium">Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400">Memuat...</td></tr>
            ) : devices.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-slate-500">Tidak ada perangkat</td></tr>
            ) : devices.map((d) => (
              <tr key={d.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeIcon[d.type] ?? "📦"}</span>
                    <div>
                      <p className="font-medium text-slate-100">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.vendor} {d.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{d.ip_address ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {d.rack?.room?.floor?.building?.name ?? "—"}<br/>
                  {d.rack?.name ?? "Tidak di rack"}
                </td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3">{warrantyBadge(d)}</td>
                {canWrite && (
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(d)} className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600">Edit</button>
                      <button onClick={() => setDeleting(d)} className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30">Hapus</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal title={editing ? "Edit Perangkat" : "Tambah Perangkat"} onClose={() => setShowForm(false)}>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {[
              { label:"Nama Perangkat", key:"name", type:"text", required:true },
              { label:"Vendor", key:"vendor", type:"text" },
              { label:"Model", key:"model", type:"text" },
              { label:"Serial Number", key:"serial_number", type:"text" },
              { label:"IP Address", key:"ip_address", type:"text" },
              { label:"MAC Address", key:"mac_address", type:"text" },
              { label:"Posisi di Rack (U)", key:"rack_position", type:"number" },
              { label:"Unit Rack (U size)", key:"rack_units", type:"number" },
              { label:"Tanggal Beli", key:"purchase_date", type:"date" },
              { label:"Garansi Sampai", key:"warranty_expiry", type:"date" },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type={type} required={required} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipe</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-2 sticky bottom-0 bg-slate-800 pb-1">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`Hapus perangkat "${deleting.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Assets\AssetsPage.jsx" -Encoding ascii

Write-Host "Update AppRoutes..." -ForegroundColor Cyan

@'
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import BuildingPage from "../pages/Building/BuildingPage.jsx";
import BuildingDetailPage from "../pages/Building/BuildingDetailPage.jsx";
import AssetsPage from "../pages/Assets/AssetsPage.jsx";
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
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="dashboard"           element={<DashboardPage />} />
        <Route path="buildings"           element={<BuildingPage />} />
        <Route path="buildings/:id"       element={<BuildingDetailPage />} />
        <Route path="assets"              element={<AssetsPage />} />
      </Route>
    </Routes>
  );
}
'@ | Set-Content -Path "src\routes\AppRoutes.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Phase 3 frontend siap." -ForegroundColor Green
Write-Host "Pastikan npm run dev masih jalan, lalu buka http://localhost:5173/buildings" -ForegroundColor Yellow