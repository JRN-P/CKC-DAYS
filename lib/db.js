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
  getHistory: (id) => request(`leave_history?request_id=eq.${id}&order=created_at`),
  getBalances: () => request("leave_balances?select=*"),
  upsertBalance: (row) => request("leave_balances?on_conflict=employee_id,leave_type", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(row) }),
  deleteRequest: (id) => request(`leave_requests?id=eq.${id}`, { method: "DELETE" }),
  resetLeaveData: async () => {
    await request("leave_history?id=not.is.null", { method: "DELETE" });
    await request("leave_requests?id=not.is.null", { method: "DELETE" });
    await request("leave_balances?id=not.is.null", { method: "DELETE" });
    return true;
  },
  getHolidays: () => request("holidays?select=*&order=date"),
  addHoliday: (h) => request("holidays", { method: "POST", body: JSON.stringify(h) }),
  deleteHoliday: (id) => request(`holidays?id=eq.${id}`, { method: "DELETE" }),
};
