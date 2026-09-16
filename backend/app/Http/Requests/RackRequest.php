<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RackRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if (!$this->has('room_id') && $this->route('room')) {
            $room = $this->route('room');
            $this->merge([
                'room_id' => is_object($room) ? $room->id : $room,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'room_id'  => ['required', 'exists:rooms,id'],
            'name'     => ['required', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:50'],
            'total_u'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
