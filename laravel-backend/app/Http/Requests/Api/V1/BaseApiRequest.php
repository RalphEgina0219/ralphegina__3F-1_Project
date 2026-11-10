<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Shared by the version 1 write requests (course L15). Bodies use the JSON:API shape:
 *
 *   { "data": { "attributes": { "fullName": "…" }, "relationships": { "barangay": { "data": { "id": 28 } } } } }
 *
 * Child classes list their fields in attributeMap(); mappedAttributes() turns the nested JSON into
 * columns, returning only the keys that were sent (which is what makes PATCH work, L18).
 */
abstract class BaseApiRequest extends FormRequest
{
    /** Who may send this request is decided by the policy in the controller (L15, L19). */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * JSON path in the request => column.
     *
     * @return array<string, string>
     */
    abstract protected function attributeMap(): array;

    /**
     * Converts the nested JSON:API payload into columns. Only keys that were sent are returned.
     *
     * @param  array<string, string>  $otherAttributes
     * @return array<string, mixed>
     */
    public function mappedAttributes(array $otherAttributes = []): array
    {
        $attributeMap = array_merge($this->attributeMap(), $otherAttributes);
        $attributesToUpdate = [];

        foreach ($attributeMap as $key => $attribute) {
            // Keep the value only if the client sent that field
            if ($this->has($key)) {
                $attributesToUpdate[$attribute] = $this->input($key);
            }
        }

        return $attributesToUpdate;
    }

    /** A trimmed string attribute, or null when it is empty. */
    public function nullableText(string $path): ?string
    {
        $value = $this->input($path);

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    /** The id of a to-one relationship: data.relationships.<name>.data.id */
    public function relationshipId(string $name): ?int
    {
        $id = $this->input("data.relationships.{$name}.data.id");

        return is_numeric($id) ? (int) $id : null;
    }

    /**
     * The ids of a to-many relationship: data.relationships.<name>.data[].id
     *
     * @return list<int>
     */
    public function relationshipIds(string $name): array
    {
        $rows = $this->input("data.relationships.{$name}.data", []);

        return is_array($rows)
            ? array_values(array_unique(array_map(fn ($row) => (int) ($row['id'] ?? 0), $rows)))
            : [];
    }

    /** Required rule for PUT and POST, sometimes for PATCH (L17, L18). */
    protected function presence(bool $partial): string
    {
        return $partial ? 'sometimes' : 'required';
    }
}
