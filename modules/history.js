export function createHistoryModule() {
  return {
    saveSession(payload) {
      try {
        const key = "incident_system_history";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({
          createdAt: new Date().toISOString(),
          ...payload
        });
        localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
        return true;
      } catch {
        return false;
      }
    },

    getSessions() {
      try {
        return JSON.parse(localStorage.getItem("incident_system_history") || "[]");
      } catch {
        return [];
      }
    }
  };
}