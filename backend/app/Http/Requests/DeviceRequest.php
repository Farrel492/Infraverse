<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeviceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'rack_id'        => ['nullable', 'exists:racks,id'],
            'name'           => ['required', 'string', 'max:255'],
            'type'           => ['required', 'in:router,switch,firewall,server,access_point,ups,other'],
            'vendor'         => ['nullable', 'string', 'max:255'],
            'model'          => ['nullable', 'string', 'max:255'],
            'serial_number'  => ['nullable', 'string', 'max:255'],
            'ip_address'     => ['nullable', 'ip'],
            'mac_address'    => ['nullable', 'string', 'max:17'],
            'status'         => ['nullable', 'in:active,inactive,maintenance,down'],
            'purchase_date'  => ['nullable', 'date'],
            'warranty_expiry'=> ['nullable', 'date'],
            'rack_position'  => ['nullable', 'integer', 'min:1'],
            'rack_units'     => ['nullable', 'integer', 'min:1'],
            'photo'          => ['nullable', 'image', 'max:2048'],
        ];
    }
}
