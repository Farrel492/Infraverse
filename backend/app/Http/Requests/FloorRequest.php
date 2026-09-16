<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FloorRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        if (!$this->has('building_id') && $this->route('building')) {
            $building = $this->route('building');
            $this->merge([
                'building_id' => is_object($building) ? $building->id : $building,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'building_id'  => ['required', 'exists:buildings,id'],
            'name'         => ['required', 'string', 'max:255'],
            'floor_number' => ['required', 'integer'],
        ];
    }
}
