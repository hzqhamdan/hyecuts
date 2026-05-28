export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

console.log("Config Loaded - API_URL:", API_URL);
console.log("Config Loaded - API_BASE:", API_BASE);
