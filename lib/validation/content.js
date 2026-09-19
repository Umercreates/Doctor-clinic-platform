import { contentSections } from "@/data/content";
import { normalizeString } from "./common";

const blockSchemas = new Map();
for (const section of contentSections) {
  for (const block of section.blocks) blockSchemas.set(block.key, block);
}

export const CONTENT_BLOCK_KEYS = [...blockSchemas.keys()];

export function getContentBlockSchema(key) {
  return blockSchemas.get(key) || null;
}

/**
 * Validate a content block payload against its declared fields. Unknown
 * fields are dropped so arbitrary JSON can never reach the database.
 */
export function validateContentBlock(key, input = {}) {
  const schema = getContentBlockSchema(key);
  if (!schema) return { valid: false, errors: { key: "Unknown content block." }, value: null };

  const errors = {};
  const value = {};
  for (const field of schema.fields) {
    const raw = input[field.name];
    if (field.type === "text" || field.type === "textarea") {
      const text = normalizeString(raw);
      if (!text) errors[field.name] = `${field.label} is required.`;
      else if (text.length > field.max) errors[field.name] = `${field.label} must be ${field.max} characters or fewer.`;
      else value[field.name] = text;
    } else if (field.type === "lines") {
      const lines = Array.isArray(raw) ? raw : String(raw ?? "").split("\n");
      const cleaned = lines.map((l) => normalizeString(l)).filter(Boolean);
      if (!cleaned.length) errors[field.name] = `${field.label} needs at least one entry.`;
      else if (cleaned.length > field.max) errors[field.name] = `${field.label} allows at most ${field.max} entries.`;
      else if (cleaned.some((l) => l.length > field.itemMax)) errors[field.name] = `Each entry must be ${field.itemMax} characters or fewer.`;
      else value[field.name] = cleaned;
    } else if (field.type === "items") {
      if (!Array.isArray(raw) || raw.length !== field.count) {
        errors[field.name] = `${field.label.replace(/\s*\(.*\)$/, "")} must contain exactly ${field.count} entries.`;
        continue;
      }
      const items = [];
      let itemError = null;
      raw.forEach((item, index) => {
        const cleaned = {};
        for (const sub of field.fields) {
          const text = normalizeString(item?.[sub]);
          if (!text) itemError = itemError || `Entry ${index + 1}: ${sub} is required.`;
          else if (text.length > 400) itemError = itemError || `Entry ${index + 1}: ${sub} is too long.`;
          cleaned[sub] = text;
        }
        // Preserve non-editable presentation keys (e.g. icon) from the stored/default item.
        if (item?.icon && typeof item.icon === "string") cleaned.icon = item.icon.slice(0, 40);
        items.push(cleaned);
      });
      if (itemError) errors[field.name] = itemError;
      else value[field.name] = items;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
