<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RoomRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if (!$this->has('floor_id') && $this->route('floor')) {
            $floor = $this->route('floor');
            $this->merge([
                'floor_id' => is_object($floor) ? $floor->id : $floor,
            ]);
        }
    }

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
