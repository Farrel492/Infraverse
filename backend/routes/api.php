<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BuildingController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\DeviceDocumentController;
use App\Http\Controllers\Api\MappingController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\DigitalTwinController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',      [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile
    Route::patch('/profile',          [ProfileController::class, 'update']);
    Route::patch('/profile/password', [ProfileController::class, 'changePassword']);

    // Buildings
    Route::get('/buildings',                   [BuildingController::class, 'index']);
    Route::get('/buildings/{building}',        [BuildingController::class, 'show']);
    Route::get('/buildings/{building}/floors', [BuildingController::class, 'floorIndex']);
    Route::get('/floors/{floor}/rooms',        [BuildingController::class, 'roomIndex']);
    Route::get('/rooms/{room}/racks',          [BuildingController::class, 'rackIndex']);

    // Devices
    Route::get('/devices',               [DeviceController::class, 'index']);
    Route::get('/devices/{device}',      [DeviceController::class, 'show']);
    Route::get('/racks/{rack}/devices',  [DeviceController::class, 'byRack']);

    // Mapping
    Route::get('/mapping/topology',                    [MappingController::class, 'topology']);
    Route::delete('/mapping/connections/{connection}', [MappingController::class, 'destroyConnection']);

    // Analytics
    Route::get('/analytics/summary',    [AnalyticsController::class, 'summary']);
    Route::get('/analytics/predictive', [AnalyticsController::class, 'predictiveMaintenance']);

    // Simulation
    Route::get('/simulations',                     [SimulationController::class, 'index']);
    Route::get('/simulations/logs',                [SimulationController::class, 'logs']);
    Route::get('/simulations/{simulation}',        [SimulationController::class, 'show']);
    Route::post('/simulations/{simulation}/run',   [SimulationController::class, 'run']);
    Route::post('/simulation-logs/{log}/resolve',  [SimulationController::class, 'resolve']);

    // Digital Twin
    Route::get('/digital-twin/scene',                      [DigitalTwinController::class, 'scene']);
    Route::patch('/digital-twin/devices/{device}/status',  [DigitalTwinController::class, 'updateDeviceStatus']);

    // Maintenance ??? semua role bisa lihat
    Route::get('/maintenances', [MaintenanceController::class, 'index']);

    // Write ??? admin & teknisi only
    Route::middleware('role:admin,teknisi')->group(function () {
        Route::post('/buildings',                            [BuildingController::class, 'store']);
        Route::post('/buildings/{building}',                 [BuildingController::class, 'update']);
        Route::delete('/buildings/{building}',               [BuildingController::class, 'destroy']);

        Route::post('/buildings/{building}/floors',          [BuildingController::class, 'floorStore']);
        Route::post('/buildings/{building}/floors/{floor}',  [BuildingController::class, 'floorUpdate']);
        Route::delete('/buildings/{building}/floors/{floor}',[BuildingController::class, 'floorDestroy']);

        Route::post('/floors/{floor}/rooms',                 [BuildingController::class, 'roomStore']);
        Route::post('/floors/{floor}/rooms/{room}',          [BuildingController::class, 'roomUpdate']);
        Route::delete('/floors/{floor}/rooms/{room}',        [BuildingController::class, 'roomDestroy']);

        Route::post('/rooms/{room}/racks',                   [BuildingController::class, 'rackStore']);
        Route::post('/rooms/{room}/racks/{rack}',            [BuildingController::class, 'rackUpdate']);
        Route::delete('/rooms/{room}/racks/{rack}',          [BuildingController::class, 'rackDestroy']);

        Route::post('/devices',            [DeviceController::class, 'store']);
        Route::post('/devices/{device}',   [DeviceController::class, 'update']);
        Route::delete('/devices/{device}', [DeviceController::class, 'destroy']);

        Route::post('/mapping/connections', [MappingController::class, 'storeConnection']);

        Route::post('/maintenances',                   [MaintenanceController::class, 'store']);
        Route::patch('/maintenances/{maintenance}',    [MaintenanceController::class, 'update']);
        Route::delete('/maintenances/{maintenance}',   [MaintenanceController::class, 'destroy']);

        Route::post('/devices/{device}/documents',              [DeviceDocumentController::class, 'store']);
        Route::delete('/devices/{device}/documents/{document}', [DeviceDocumentController::class, 'destroy']);
    });

    // Admin Only: User Management
    Route::middleware('role:admin')->group(function () {
        Route::get('/users',                      [\App\Http\Controllers\Api\UserController::class, 'index']);
        Route::post('/users',                     [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::get('/users/{user}',               [\App\Http\Controllers\Api\UserController::class, 'show']);
        Route::patch('/users/{user}',             [\App\Http\Controllers\Api\UserController::class, 'update']);
        Route::delete('/users/{user}',            [\App\Http\Controllers\Api\UserController::class, 'destroy']);
        Route::post('/users/{user}/reset-password',[\App\Http\Controllers\Api\UserController::class, 'resetPassword']);
    });
});
