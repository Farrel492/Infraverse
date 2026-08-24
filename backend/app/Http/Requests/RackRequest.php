<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RackRequest extends FormRequest
{
    public function authorize(): bool { return true; }

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
