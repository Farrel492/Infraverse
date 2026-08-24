<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BuildingRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'location'     => ['nullable', 'string', 'max:255'],
            'total_floors' => ['nullable', 'integer', 'min:1'],
            'description'  => ['nullable', 'string'],
            'image'        => ['nullable', 'image', 'max:2048'],
        ];
    }
}
