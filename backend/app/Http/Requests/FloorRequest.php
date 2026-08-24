<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FloorRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'building_id'  => ['required', 'exists:buildings,id'],
            'name'         => ['required', 'string', 'max:255'],
            'floor_number' => ['required', 'integer'],
        ];
    }
}
