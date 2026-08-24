<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\DeviceDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DeviceDocumentController extends Controller
{
    public function store(Request $request, Device $device): JsonResponse
    {
        $request->validate([
            'document' => ['required', 'file', 'max:5120', 'mimes:pdf,jpg,jpeg,png,webp'],
            'name'     => ['nullable', 'string', 'max:255'],
        ]);

        $path = $request->file('document')->store("documents/device-{$device->id}", 'public');

        $doc = DeviceDocument::create([
            'device_id' => $device->id,
            'name'      => $request->name ?? $request->file('document')->getClientOriginalName(),
            'file_path' => $path,
            'type'      => $request->file('document')->getMimeType(),
        ]);

        return response()->json($doc, 201);
    }

    public function destroy(Device $device, DeviceDocument $document): JsonResponse
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->json(['message' => 'Dokumen dihapus.']);
    }
}
