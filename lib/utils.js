// /lib/utils.js

// Deep flatten nested objects into dot-notation keys
export function deepFlatten(obj, prefix = "") {
  const flat = {};
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const val = obj[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(flat, deepFlatten(val, prefixedKey));
    } else {
      flat[prefixedKey] = val;
    }
  }
  return flat;
}
