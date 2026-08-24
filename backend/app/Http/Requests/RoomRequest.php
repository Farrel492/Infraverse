<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'floor_id' => ['required', 'exists:floors,id'],
            'name'     => ['required', 'string', 'max:255'],
            'type'     => ['required', 'in:server_room,office,classroom,lab,storage,other'],
            'width'    => ['nullable', 'numeric', 'min:0'],
            'depth'    => ['nullable', 'numeric', 'min:0'],
            'height'   => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
