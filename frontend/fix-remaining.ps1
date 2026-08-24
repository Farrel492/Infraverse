if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\components\shared","src\pages\Building","src\pages\Mapping","src\pages\Simulation","src\pages\DigitalTwin","src\pages\Maintenance" | Out-Null

Write-Host "Fix Modal & ConfirmDialog..." -ForegroundColor Cyan

@'
import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose}
            className="text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg p-1 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\Modal.jsx" -Encoding ascii

@'
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <p className="text-slate-100 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
            Batal
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\ConfirmDialog.jsx" -Encoding ascii

@'
import { Inbox } from "lucide-react";

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-4 text-slate-600">
        {icon ?? <Inbox size={32} />}
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <button onClick={action.onClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {action.label}
        </button>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\components\shared\EmptyState.jsx" -Encoding ascii

Write-Host "Fix BuildingPage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonCard } from "../../components/shared/Skeleton.jsx";
import { Building2, Plus, Edit2, Trash2, ChevronRight, Layers, DoorOpen } from "lucide-react";

export default function BuildingPage() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [form, setForm]           = useState({ name:"", location:"", total_floors:1, description:"" });

  const load = async () => {
    try { const res = await buildingService.getAll(); setBuildings(res.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name:"", location:"", total_floors:1, description:"" });
    setError(""); setShowForm(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ name:b.name, location:b.location??""  , total_floors:b.total_floors, description:b.description??"" });
    setError(""); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k,v));
      if (editing) await buildingService.update(editing.id, fd);
      else await buildingService.create(fd);
      setShowForm(false); load();
    } catch (err) {
      setError(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await buildingService.remove(deleting.id);
    setDeleting(null); load();
  };

  if (loading) return (
    <div className="p-8">
      <div className="h-8 bg-slate-700 rounded w-48 animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({length:3}).map((_,i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Gedung" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Gedung</h2>
          <p className="text-slate-400 text-sm mt-1">{buildings.length} gedung terdaftar</p>
        </div>
        {canWrite && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Tambah Gedung
          </button>
        )}
      </div>

      {buildings.length === 0 ? (
        <EmptyState
          icon={<Building2 size={32} />}
          title="Belum ada gedung"
          description="Tambah gedung untuk mulai mengelola infrastruktur."
          action={canWrite ? { label:"Tambah Gedung", onClick: openAdd } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {buildings.map((b) => (
            <div key={b.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <Building2 size={22} className="text-blue-400" />
                </div>
                {canWrite && (
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(b)}
                      className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleting(b)}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-100 text-lg leading-tight">{b.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{b.location ?? "—"}</p>
              {b.description && (
                <p className="text-slate-500 text-xs mt-2 line-clamp-2">{b.description}</p>
              )}

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers size={14} />
                  <div>
                    <p className="text-lg font-bold text-blue-400 leading-none">{b.total_floors}</p>
                    <p className="text-xs">Lantai</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <DoorOpen size={14} />
                  <div>
                    <p className="text-lg font-bold text-blue-400 leading-none">{b.floors_count ?? 0}</p>
                    <p className="text-xs">Terdaftar</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/buildings/${b.id}`)}
                  className="ml-auto flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Detail <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? "Edit Gedung" : "Tambah Gedung"} onClose={() => setShowForm(false)}>
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { label:"Nama Gedung",   key:"name",         type:"text",   required:true },
              { label:"Lokasi",        key:"location",     type:"text" },
              { label:"Jumlah Lantai", key:"total_floors", type:"number" },
            ].map(({ label, key, type, required }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">{label}</label>
                <input type={type} required={required} value={form[key]}
                  onChange={e => setForm({...form, [key]: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Deskripsi</label>
              <textarea rows={3} value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
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
          message={`Hapus gedung "${deleting.name}"? Semua lantai, ruangan, rack, dan perangkat di dalamnya juga akan terhapus.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Building\BuildingPage.jsx" -Encoding ascii

Write-Host "Fix BuildingDetailPage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { Plus, Server, ArrowLeft } from "lucide-react";

export default function BuildingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

  const [building, setBuilding]   = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [floorModal, setFloorModal] = useState(false);
  const [roomModal, setRoomModal]   = useState(false);
  const [rackModal, setRackModal]   = useState(false);
  const [floorForm, setFloorForm] = useState({ name:"", floor_number:"" });
  const [roomForm, setRoomForm]   = useState({ name:"", type:"server_room" });
  const [rackForm, setRackForm]   = useState({ name:"", position:"", total_u:42 });
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

  const floors = building?.floors ?? [];
  const rooms  = activeFloor?.rooms ?? [];
  const racks  = activeRoom?.racks  ?? [];
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

  if (loading) return <div className="p-8 text-slate-400">Memuat data gedung...</div>;
  if (!building) return <div className="p-8 text-red-400">Gedung tidak ditemukan.</div>;

  return (
    <div className="p-8">
      <Breadcrumb items={[
        { label:"Dashboard", href:"/dashboard" },
        { label:"Gedung", href:"/buildings" },
        { label: building.name },
      ]} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/buildings")}
          className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-100 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-100">{building.name}</h2>
          <p className="text-xs text-slate-400">{building.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lantai */}
        <div className="col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Lantai</h3>
            {canWrite && (
              <button onClick={() => setFloorModal(true)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <Plus size={12} /> Tambah
              </button>
            )}
          </div>
          <div className="space-y-1">
            {floors.map((f) => (
              <button key={f.id}
                onClick={() => { setActiveFloor(f); setActiveRoom(null); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeFloor?.id === f.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700"
                }`}>
                {f.name}
              </button>
            ))}
            {floors.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">Belum ada lantai</p>
            )}
          </div>
        </div>

        {/* Ruangan */}
        <div className="col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Ruangan</h3>
            {canWrite && activeFloor && (
              <button onClick={() => setRoomModal(true)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <Plus size={12} /> Tambah
              </button>
            )}
          </div>
          <div className="space-y-1">
            {rooms.map((r) => (
              <button key={r.id}
                onClick={() => setActiveRoom(r)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeRoom?.id === r.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-700"
                }`}>
                <span className="block leading-tight">{r.name}</span>
                <span className="block text-xs opacity-60 capitalize">
                  {r.type.replace("_"," ")}
                </span>
              </button>
            ))}
            {rooms.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">
                {activeFloor ? "Belum ada ruangan" : "Pilih lantai dulu"}
              </p>
            )}
          </div>
        </div>

        {/* Rack */}
        <div className="col-span-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Rack {activeRoom ? `— ${activeRoom.name}` : ""}
            </h3>
            {canWrite && activeRoom && (
              <button onClick={() => setRackModal(true)}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <Plus size={12} /> Tambah Rack
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {racks.map((rack) => (
              <div key={rack.id}
                className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 hover:border-blue-500/40 transition-colors">
                <div className="w-10 h-10 bg-slate-600/50 rounded-lg flex items-center justify-center mb-3">
                  <Server size={18} className="text-slate-400" />
                </div>
                <p className="font-medium text-slate-100 text-sm">{rack.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Posisi: {rack.position ?? "—"} · {rack.total_u}U
                </p>
                <button
                  onClick={() => navigate(`/assets?rack_id=${rack.id}`)}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  Lihat Perangkat <ChevronRight size={12} />
                </button>
              </div>
            ))}
            {racks.length === 0 && (
              <p className="text-xs text-slate-600 col-span-2 text-center py-8">
                {activeRoom ? "Belum ada rack" : "Pilih ruangan dulu"}
              </p>
            )}
          </div>
        </div>
      </div>

      {floorModal && (
        <Modal title="Tambah Lantai" onClose={() => setFloorModal(false)}>
          <form onSubmit={saveFloor} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Lantai</label>
              <input required value={floorForm.name}
                onChange={e => setFloorForm({...floorForm, name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nomor Lantai</label>
              <input type="number" required value={floorForm.floor_number}
                onChange={e => setFloorForm({...floorForm, floor_number: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setFloorModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {roomModal && (
        <Modal title="Tambah Ruangan" onClose={() => setRoomModal(false)}>
          <form onSubmit={saveRoom} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Ruangan</label>
              <input required value={roomForm.name}
                onChange={e => setRoomForm({...roomForm, name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipe Ruangan</label>
              <select value={roomForm.type}
                onChange={e => setRoomForm({...roomForm, type: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500">
                {roomTypes.map(t => (
                  <option key={t} value={t}>{t.replace("_"," ")}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setRoomModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {rackModal && (
        <Modal title="Tambah Rack" onClose={() => setRackModal(false)}>
          <form onSubmit={saveRack} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Rack</label>
              <input required value={rackForm.name}
                onChange={e => setRackForm({...rackForm, name: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Posisi (misal: A1)</label>
              <input value={rackForm.position}
                onChange={e => setRackForm({...rackForm, position: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Total U</label>
              <input type="number" value={rackForm.total_u}
                onChange={e => setRackForm({...rackForm, total_u: e.target.value})}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setRackModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Batal</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Building\BuildingDetailPage.jsx" -Encoding ascii

Write-Host "Fix MaintenancePage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { maintenanceService } from "../../services/maintenanceService";
import { deviceService } from "../../services/deviceService";
import useAuthStore from "../../stores/authStore";
import Modal from "../../components/shared/Modal.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import EmptyState from "../../components/shared/EmptyState.jsx";
import Breadcrumb from "../../components/shared/Breadcrumb.jsx";
import { SkeletonTable } from "../../components/shared/Skeleton.jsx";
import {
  Wrench, Plus, Edit2, Trash2, CheckCircle,
  Clock, AlertCircle, XCircle
} from "lucide-react";

const STATUS_MAP = {
  scheduled:   { label:"Terjadwal",   cls:"bg-blue-500/10 text-blue-400 border-blue-500/20",     Icon: Clock },
  in_progress: { label:"Berlangsung", cls:"bg-yellow-500/10 text-yellow-400 border-yellow-500/20", Icon: AlertCircle },
  completed:   { label:"Selesai",     cls:"bg-green-500/10 text-green-400 border-green-500/20",   Icon: CheckCircle },
  cancelled:   { label:"Dibatalkan",  cls:"bg-slate-500/10 text-slate-400 border-slate-500/20",   Icon: XCircle },
};
const TYPE_MAP = { preventive:"Preventif", corrective:"Korektif" };

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const canWrite  = user?.role === "admin" || user?.role === "teknisi";

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
      const [m, d] = await Promise.all([maintenanceService.getAll(), deviceService.getAll()]);
      setItems(m.data);
      setDevices(d.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const counts = {
    all: items.length,
    scheduled:   items.filter(i => i.status === "scheduled").length,
    in_progress: items.filter(i => i.status === "in_progress").length,
    completed:   items.filter(i => i.status === "completed").length,
  };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
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
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await maintenanceService.update(editing.id, form);
      else await maintenanceService.create(form);
      toast.success(editing ? "Jadwal diperbarui." : "Jadwal ditambahkan.");
      setShowForm(false); load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Terjadi kesalahan.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await maintenanceService.remove(deleting.id);
    toast.success("Jadwal dihapus.");
    setDeleting(null); load();
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      await maintenanceService.update(item.id, { ...item, status: newStatus });
      toast.success(`Status diubah ke ${STATUS_MAP[newStatus]?.label}.`);
      load();
    } catch { toast.error("Gagal mengubah status."); }
  };

  return (
    <div className="p-8">
      <Breadcrumb items={[{ label:"Dashboard", href:"/dashboard" }, { label:"Maintenance" }]} />

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Manajemen Maintenance</h2>
          <p className="text-slate-400 text-sm mt-1">
            Jadwalkan dan pantau maintenance perangkat infrastruktur
          </p>
        </div>
        {canWrite && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Tambah Jadwal
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
          icon={<Wrench size={32} />}
          title="Belum ada jadwal maintenance"
          description="Tambah jadwal maintenance untuk memantau kondisi perangkat secara berkala."
          action={canWrite ? { label:"Tambah Jadwal", onClick: openAdd } : null}
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
                const s = STATUS_MAP[item.status] ?? { label: item.status, cls:"", Icon: Clock };
                const isOverdue = item.status === "scheduled"
                  && new Date(item.scheduled_date) < new Date();
                return (
                  <tr key={item.id}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors ${
                      isOverdue ? "bg-red-500/5" : ""
                    }`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Wrench size={13} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-100">{item.device?.name ?? "—"}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.device?.type}</p>
                        </div>
                      </div>
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
                        {item.scheduled_date
                          ? new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                              day:"numeric", month:"short", year:"numeric"
                            })
                          : "—"}
                        {isOverdue && <span className="ml-1 text-xs">(Terlambat)</span>}
                      </p>
                      {item.completed_date && (
                        <p className="text-xs text-green-400">
                          Selesai: {new Date(item.completed_date).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {canWrite ? (
                        <select value={item.status}
                          onChange={e => handleStatusChange(item, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer focus:outline-none ${s.cls}`}>
                          {Object.entries(STATUS_MAP).map(([k,v]) => (
                            <option key={k} value={k} className="bg-slate-800 text-slate-100">
                              {v.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${s.cls}`}>
                          <s.Icon size={11} />
                          {s.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">
                      <p className="truncate">{item.notes ?? "—"}</p>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(item)}
                            className="p-1.5 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleting(item)}
                            className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                            <Trash2 size={13} />
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

Write-Host ""
Write-Host "SELESAI. Semua halaman sudah bebas emoji." -ForegroundColor Green
Write-Host "Hard refresh: Ctrl+Shift+R" -ForegroundColor Yellow