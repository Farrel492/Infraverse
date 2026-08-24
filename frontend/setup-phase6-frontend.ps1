if (-not (Test-Path "vite.config.js")) {
    Write-Host "ERROR: jalankan dari folder frontend." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "src\pages\Simulation","src\pages\DigitalTwin","src\services" | Out-Null

Write-Host "Menulis services..." -ForegroundColor Cyan

@'
import api from "./api";
export const simulationService = {
  getAll:   ()     => api.get("/simulations"),
  getLogs:  ()     => api.get("/simulations/logs"),
  getOne:   (id)   => api.get(`/simulations/${id}`),
  run:      (id)   => api.post(`/simulations/${id}/run`),
  resolve:  (logId)=> api.post(`/simulation-logs/${logId}/resolve`),
};
'@ | Set-Content -Path "src\services\simulationService.js" -Encoding ascii

@'
import api from "./api";
export const digitalTwinService = {
  getScene:        (buildingId = 1) => api.get(`/digital-twin/scene?building_id=${buildingId}`),
  updateStatus:    (deviceId, status) => api.patch(`/digital-twin/devices/${deviceId}/status`, { status }),
};
'@ | Set-Content -Path "src\services\digitalTwinService.js" -Encoding ascii

Write-Host "Menulis SimulationPage..." -ForegroundColor Cyan

@'
import { useEffect, useState } from "react";
import { simulationService } from "../../services/simulationService";

const TYPE_ICON = {
  router_down:"🔀", switch_down:"🔌", fiber_cut:"✂️",
  ups_failure:"🔋", server_offline:"🖥",
};
const TYPE_COLOR = {
  router_down:"border-blue-500/40 bg-blue-500/5",
  switch_down:"border-purple-500/40 bg-purple-500/5",
  fiber_cut:"border-yellow-500/40 bg-yellow-500/5",
  ups_failure:"border-pink-500/40 bg-pink-500/5",
  server_offline:"border-green-500/40 bg-green-500/5",
};

export default function SimulationPage() {
  const [scenarios, setScenarios] = useState([]);
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [active, setActive]       = useState(null);
  const [running, setRunning]     = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [tab, setTab]             = useState("scenarios");

  const load = async () => {
    const [sc, lg] = await Promise.all([
      simulationService.getAll(),
      simulationService.getLogs(),
    ]);
    setScenarios(sc.data);
    setLogs(lg.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRun = async (scenario) => {
    setActive(scenario);
    const res = await simulationService.run(scenario.id);
    setRunning(res.data);
    setStepIndex(0);
  };

  const handleNextStep = () => {
    if (stepIndex < (running?.steps?.length ?? 0) - 1) {
      setStepIndex(i => i + 1);
    }
  };

  const handleResolve = async () => {
    setResolving(true);
    await simulationService.resolve(running.log_id);
    setResolving(false);
    setRunning(null);
    setActive(null);
    load();
  };

  const handleClose = () => { setRunning(null); setActive(null); };

  const formatDuration = (s) => {
    if (!s && s !== 0) return "—";
    if (s < 60) return `${s}d`;
    return `${Math.floor(s/60)}m ${s%60}d`;
  };

  if (loading) return <div className="p-8 text-slate-400">Memuat skenario simulasi...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Simulation Center</h2>
        <p className="text-slate-400 text-sm mt-1">
          Simulasi skenario gangguan infrastruktur dan latih respons insiden
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 border border-slate-700 rounded-xl p-1 w-fit">
        {[["scenarios","⚡ Skenario"],["logs","📋 Riwayat"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "scenarios" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <div key={s.id}
              className={`border rounded-xl p-5 flex flex-col gap-3 transition-all ${TYPE_COLOR[s.scenario_type] ?? "border-slate-700 bg-slate-800"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICON[s.scenario_type] ?? "⚡"}</span>
                  <div>
                    <h3 className="font-semibold text-slate-100 text-sm">{s.name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{s.scenario_type.replace(/_/g," ")}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>

              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-xs text-orange-300 font-medium mb-1">⚠ Dampak:</p>
                <p className="text-xs text-slate-300">{s.impact_description}</p>
              </div>

              {s.device && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>🎯 Target:</span>
                  <span className="text-slate-300">{s.device.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                <span className="text-xs text-slate-500">
                  {s.times_run > 0 ? `Terakhir dijalankan` : "Belum pernah dijalankan"}
                </span>
                <button onClick={() => handleRun(s)}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                  ▶ Jalankan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-left">
                <th className="px-4 py-3 font-medium">Skenario</th>
                <th className="px-4 py-3 font-medium">Dijalankan Oleh</th>
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Durasi</th>
                <th className="px-4 py-3 font-medium">Hasil</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Belum ada simulasi dijalankan</td></tr>
              ) : logs.map((l) => (
                <tr key={l.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{TYPE_ICON[l.type] ?? "⚡"}</span>
                      <span className="text-slate-200">{l.scenario}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{l.user}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {l.started_at ? new Date(l.started_at).toLocaleString("id-ID") : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDuration(l.duration)}</td>
                  <td className="px-4 py-3">
                    {l.resolved
                      ? <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">✓ Selesai</span>
                      : <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">⏳ Belum selesai</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simulation Runner Modal */}
      {running && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-red-500/5">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-slate-100">{running.scenario.name}</h3>
                  <p className="text-xs text-slate-400">{running.scenario.impact_description}</p>
                </div>
              </div>
              <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded font-mono">
                SIMULASI AKTIF
              </span>
            </div>

            {/* Affected Devices */}
            {running.scenario.affected_device_ids?.length > 0 && (
              <div className="px-6 py-3 bg-orange-500/5 border-b border-slate-700">
                <p className="text-xs text-orange-300 font-medium">
                  ⚠ {running.scenario.affected_device_ids.length} perangkat terdampak
                </p>
              </div>
            )}

            {/* Steps */}
            <div className="px-6 py-4 space-y-2 max-h-72 overflow-y-auto">
              {running.steps.map((step, i) => (
                <div key={i}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                    i < stepIndex
                      ? "bg-green-500/10 border border-green-500/20 text-green-300"
                      : i === stepIndex
                      ? "bg-blue-500/15 border border-blue-500/30 text-slate-100 scale-[1.01]"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-500"
                  }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    i < stepIndex ? "bg-green-500 text-white"
                    : i === stepIndex ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-500"
                  }`}>
                    {i < stepIndex ? "✓" : i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="px-6 pb-2">
              <div className="bg-slate-700 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${((stepIndex + 1) / running.steps.length) * 100}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1 text-right">
                Langkah {stepIndex + 1} dari {running.steps.length}
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-700">
              <button onClick={handleClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded-lg">
                Keluar
              </button>
              {stepIndex < running.steps.length - 1 ? (
                <button onClick={handleNextStep}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
                  Langkah Berikutnya →
                </button>
              ) : (
                <button onClick={handleResolve} disabled={resolving}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
                  {resolving ? "Menyelesaikan..." : "✓ Tandai Selesai"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'@ | Set-Content -Path "src\pages\Simulation\SimulationPage.jsx" -Encoding ascii

Write-Host "Menulis DigitalTwinPage (Three.js 3D)..." -ForegroundColor Cyan

@'
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { digitalTwinService } from "../../services/digitalTwinService";

const STATUS_COLOR = {
  active:"#22c55e", inactive:"#6b7280", maintenance:"#eab308", down:"#ef4444",
};
const TYPE_COLOR = {
  router:"#3b82f6", switch:"#8b5cf6", firewall:"#ef4444",
  server:"#10b981", access_point:"#f59e0b", ups:"#ec4899", other:"#6b7280",
};
const STATUS_LABEL = { active:"Aktif", inactive:"Nonaktif", maintenance:"Maintenance", down:"Down" };

export default function DigitalTwinPage() {
  const mountRef   = useRef(null);
  const sceneRef   = useRef(null);
  const cameraRef  = useRef(null);
  const rendererRef= useRef(null);
  const frameRef   = useRef(null);
  const meshMapRef = useRef({});
  const isDragging = useRef(false);
  const prevMouse  = useRef({ x:0, y:0 });
  const spherical  = useRef({ theta: Math.PI/4, phi: Math.PI/3, radius: 18 });

  const [sceneData, setSceneData] = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await digitalTwinService.getScene(1);
    setSceneData(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!sceneData || !mountRef.current) return;

    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f172a");
    scene.fog = new THREE.Fog("#0f172a", 30, 60);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    scene.add(new THREE.AmbientLight("#ffffff", 0.6));
    const dirLight = new THREE.DirectionalLight("#ffffff", 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(new THREE.HemisphereLight("#1e3a5f", "#0f172a", 0.4));

    // Grid floor
    const grid = new THREE.GridHelper(40, 40, "#1e293b", "#1e293b");
    scene.add(grid);

    const meshMap = {};

    // Build rooms
    sceneData.nodes.forEach(node => {
      if (node.type !== "room") return;
      const geo = new THREE.BoxGeometry(node.w, node.h, node.d);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        transparent: true, opacity: 0.15,
        wireframe: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        node.x + node.w / 2,
        node.y + node.h / 2,
        node.z + node.d / 2
      );
      scene.add(mesh);

      // Room border wireframe
      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: node.color, opacity: 0.5, transparent: true });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.copy(mesh.position);
      scene.add(wireframe);

      // Room label sprite
      const sprite = makeLabel(node.label, "#94a3b8");
      sprite.position.set(mesh.position.x, node.y + node.h + 0.3, mesh.position.z);
      scene.add(sprite);
    });

    // Build racks & devices
    sceneData.racks.forEach(rack => {
      const rackH = 2.0;
      const rackW = 0.6;
      const rackD = 0.8;

      // Rack cabinet
      const rackGeo = new THREE.BoxGeometry(rackW, rackH, rackD);
      const rackMat = new THREE.MeshStandardMaterial({ color: "#1e293b", metalness: 0.8, roughness: 0.2 });
      const rackMesh = new THREE.Mesh(rackGeo, rackMat);
      rackMesh.position.set(rack.x + rackW / 2, rack.y + rackH / 2, rack.z + rackD / 2);
      rackMesh.castShadow = true;
      rackMesh.userData = { type: "rack", rackId: rack.id, name: rack.name };
      scene.add(rackMesh);

      // Rack label
      const rLabel = makeLabel(rack.name, "#64748b");
      rLabel.position.set(rackMesh.position.x, rack.y + rackH + 0.4, rackMesh.position.z);
      scene.add(rLabel);

      // Devices inside rack
      rack.devices.forEach((device, di) => {
        const dH = 0.08 * (device.u_size ?? 1);
        const dW = rackW - 0.08;
        const dD = rackD - 0.08;
        const slotY = rack.y + 0.1 + di * (dH + 0.04);

        const color = new THREE.Color(STATUS_COLOR[device.status] ?? "#6b7280");
        const dGeo = new THREE.BoxGeometry(dW, dH, dD);
        const dMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: device.status === "active" ? 0.15 : 0,
          metalness: 0.6, roughness: 0.3,
        });
        const dMesh = new THREE.Mesh(dGeo, dMat);
        dMesh.position.set(
          rackMesh.position.x,
          slotY + dH / 2,
          rackMesh.position.z
        );
        dMesh.castShadow = true;
        dMesh.userData = { type: "device", deviceId: device.id, device };
        scene.add(dMesh);
        meshMap[device.id] = dMesh;

        // Status LED dot
        const ledGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const ledMat = new THREE.MeshBasicMaterial({ color });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(
          rackMesh.position.x + dW / 2 - 0.05,
          slotY + dH / 2,
          rackMesh.position.z - dD / 2 + 0.05
        );
        scene.add(led);
      });
    });

    meshMapRef.current = meshMap;

    // Camera position
    updateCamera();

    // Raycaster for click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e) => {
      if (isDragging.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, false);
      const hit = hits.find(h => h.object.userData?.type === "device");
      if (hit) {
        setSelected(hit.object.userData.device);
        // Highlight
        Object.values(meshMap).forEach(m => {
          m.material.emissiveIntensity = m.userData.device?.status === "active" ? 0.15 : 0;
        });
        hit.object.material.emissiveIntensity = 0.6;
      } else {
        setSelected(null);
        Object.values(meshMap).forEach(m => {
          m.material.emissiveIntensity = m.userData.device?.status === "active" ? 0.15 : 0;
        });
      }
    };

    // Orbit controls (manual)
    const onMouseDown = (e) => {
      isDragging.current = false;
      prevMouse.current = { x: e.clientX, y: e.clientY };
      renderer.domElement.addEventListener("mousemove", onMouseMove);
      renderer.domElement.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;
      spherical.current.theta -= dx * 0.005;
      spherical.current.phi   = Math.max(0.2, Math.min(Math.PI/2 - 0.05, spherical.current.phi - dy * 0.005));
      prevMouse.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const onMouseUp = () => {
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
    };

    const onWheel = (e) => {
      spherical.current.radius = Math.max(5, Math.min(35, spherical.current.radius + e.deltaY * 0.02));
      updateCamera();
    };

    function updateCamera() {
      const { theta, phi, radius } = spherical.current;
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(2, 1, 2);
    }

    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });

    // Animate
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      if (!mountRef.current) return;
      const W2 = mountRef.current.clientWidth;
      const H2 = mountRef.current.clientHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("wheel", onWheel);
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [sceneData]);

  const handleStatusChange = async (newStatus) => {
    if (!selected) return;
    setUpdatingStatus(true);
    await digitalTwinService.updateStatus(selected.id, newStatus);
    setUpdatingStatus(false);

    // Update visual
    const mesh = meshMapRef.current[selected.id];
    if (mesh) {
      const color = new THREE.Color(STATUS_COLOR[newStatus]);
      mesh.material.color.set(color);
      mesh.material.emissive.set(color);
      mesh.material.emissiveIntensity = newStatus === "active" ? 0.15 : 0;
    }
    setSelected(prev => prev ? { ...prev, status: newStatus } : prev);
    load();
  };

  return (
    <div className="flex h-full">
      <div ref={mountRef} className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-pulse">🌐</div>
              <p className="text-slate-400">Membangun Digital Twin...</p>
            </div>
          </div>
        )}

        {/* Overlay hint */}
        {!loading && (
          <div className="absolute bottom-4 left-4 text-xs text-slate-600 space-y-0.5 pointer-events-none">
            <p>🖱 Drag — orbit kamera</p>
            <p>🖱 Scroll — zoom</p>
            <p>🖱 Klik device — lihat detail</p>
          </div>
        )}

        {/* Status summary overlay */}
        {sceneData && (
          <div className="absolute top-4 left-4 bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs">
            <p className="text-slate-400 font-medium mb-2">{sceneData.building.name}</p>
            {Object.entries(sceneData.status_summary ?? {}).map(([s, count]) => (
              <div key={s} className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                <span className="text-slate-400 capitalize">{STATUS_LABEL[s] ?? s}</span>
                <span className="ml-auto text-slate-200 font-bold">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="w-72 bg-slate-800 border-l border-slate-700 p-5 overflow-y-auto">
        {selected ? (
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🖥</span>
              <div>
                <h3 className="font-semibold text-slate-100">{selected.name}</h3>
                <p className="text-xs text-slate-400 capitalize">{selected.type?.replace("_"," ")}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                ["Vendor", selected.vendor ?? "—"],
                ["Model",  selected.model  ?? "—"],
                ["IP Address", selected.ip ?? "—"],
                ["Posisi Rack", `U${selected.u_pos ?? "?"}`],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm text-slate-200">{val}</p>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <p className="text-xs text-slate-500 mb-2">Status Saat Ini</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ borderColor: STATUS_COLOR[selected.status] + "40", background: STATUS_COLOR[selected.status] + "15" }}>
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[selected.status] }} />
                <span className="text-sm font-medium" style={{ color: STATUS_COLOR[selected.status] }}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">Ubah Status (Simulasi)</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_LABEL).map(([s, label]) => (
                  <button key={s}
                    disabled={updatingStatus || s === selected.status}
                    onClick={() => handleStatusChange(s)}
                    className="py-2 text-xs rounded-lg border transition-colors disabled:opacity-30"
                    style={{
                      borderColor: STATUS_COLOR[s] + "50",
                      color: STATUS_COLOR[s],
                      background: s === selected.status ? STATUS_COLOR[s] + "20" : "transparent",
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-2 text-center">
                Perubahan langsung terrefleksi di 3D
              </p>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 text-sm mt-12">
            <p className="text-3xl mb-3">🌐</p>
            <p className="font-medium text-slate-400">Digital Twin 3D</p>
            <p className="mt-2 text-xs">Klik perangkat di viewer untuk melihat detail dan mengubah status</p>
            <hr className="border-slate-700 my-6" />
            <div className="space-y-2 text-left">
              {Object.entries(STATUS_COLOR).map(([s, c]) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: c }} />
                  <span className="text-slate-400">{STATUS_LABEL[s]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function makeLabel(text, color) {
  const canvas  = document.createElement("canvas");
  canvas.width  = 256;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = color;
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 28);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2, 0.4, 1);
  return sprite;
}
'@ | Set-Content -Path "src\pages\DigitalTwin\DigitalTwinPage.jsx" -Encoding ascii

Write-Host "Update AppRoutes (final)..." -ForegroundColor Cyan

@'
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import LoginPage from "../pages/Auth/LoginPage.jsx";
import RegisterPage from "../pages/Auth/RegisterPage.jsx";
import DashboardPage from "../pages/Dashboard/DashboardPage.jsx";
import BuildingPage from "../pages/Building/BuildingPage.jsx";
import BuildingDetailPage from "../pages/Building/BuildingDetailPage.jsx";
import AssetsPage from "../pages/Assets/AssetsPage.jsx";
import MappingPage from "../pages/Mapping/MappingPage.jsx";
import SimulationPage from "../pages/Simulation/SimulationPage.jsx";
import DigitalTwinPage from "../pages/DigitalTwin/DigitalTwinPage.jsx";
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
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="buildings"     element={<BuildingPage />} />
        <Route path="buildings/:id" element={<BuildingDetailPage />} />
        <Route path="assets"        element={<AssetsPage />} />
        <Route path="mapping"       element={<MappingPage />} />
        <Route path="simulation"    element={<SimulationPage />} />
        <Route path="digital-twin"  element={<DigitalTwinPage />} />
      </Route>
    </Routes>
  );
}
'@ | Set-Content -Path "src\routes\AppRoutes.jsx" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. Phase 6+7 frontend siap." -ForegroundColor Green
Write-Host "Install three.js dulu: npm install three" -ForegroundColor Yellow