if (-not (Test-Path "artisan")) {
    Write-Host "ERROR: file 'artisan' tidak ditemukan di folder ini." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Force -Path "app\Http\Controllers\Api","app\Http\Requests","app\Http\Middleware" | Out-Null

Write-Host "Update User.php (tambah HasApiTokens)..." -ForegroundColor Cyan

@'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function maintenances()
    {
        return $this->hasMany(Maintenance::class, 'technician_id');
    }

    public function simulationLogs()
    {
        return $this->hasMany(SimulationLog::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isTeknisi(): bool
    {
        return $this->role === 'teknisi';
    }
}
'@ | Set-Content -Path "app\Models\User.php" -Encoding ascii

Write-Host "Menulis form requests..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => 'Email ini sudah terdaftar.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'password.min' => 'Password minimal 8 karakter.',
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\RegisterRequest.php" -Encoding ascii

@'
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
'@ | Set-Content -Path "app\Http\Requests\LoginRequest.php" -Encoding ascii

Write-Host "Menulis RoleMiddleware..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user() || ! in_array($request->user()->role, $roles, true)) {
            return response()->json([
                'message' => 'Akses ditolak. Role kamu tidak memiliki izin untuk mengakses ini.',
            ], 403);
        }

        return $next($request);
    }
}
'@ | Set-Content -Path "app\Http\Middleware\RoleMiddleware.php" -Encoding ascii

Write-Host "Menulis AuthController..." -ForegroundColor Cyan

@'
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => Hash::make($request->validated('password')),
            'role' => 'viewer',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! Hash::check($request->validated('password'), $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }
}
'@ | Set-Content -Path "app\Http\Controllers\Api\AuthController.php" -Encoding ascii

Write-Host "Menulis routes/api.php..." -ForegroundColor Cyan

@'
<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
'@ | Set-Content -Path "routes\api.php" -Encoding ascii

Write-Host ""
Write-Host "SELESAI. User model, request, middleware, controller, routes sudah ditulis." -ForegroundColor Green
Write-Host "Langkah terakhir: edit bootstrap/app.php manual (lihat instruksi)." -ForegroundColor Yellow