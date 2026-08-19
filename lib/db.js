const SUPABASE_URL = "https://prcqupqnuwpkmmatxfty.supabase.co";
const SUPABASE_KEY = "sb_publishable_ml22GU_n6Czc8lfdpKEkoQ_8cXbklaU";

async function request(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const db = {
  getEmployees: () => request("employees?select=*&order=created_at"),
  addEmployee: (emp) => request("employees", { method: "POST", body: JSON.stringify(emp) }),
  updateEmployee: (id, patch) => request(`employees?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteEmployee: (id) => request(`employees?id=eq.${id}`, { method: "DELETE" }),
  getRequests: () => request("leave_requests?select=*&order=created_at.desc"),
  addRequest: (r) => request("leave_requests", { method: "POST", body: JSON.stringify(r) }),
  updateRequest: (id, patch) => request(`leave_requests?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  addHistory: (h) => request("leave_history", { method: "POST", body: JSON.stringify(h) }),
};
