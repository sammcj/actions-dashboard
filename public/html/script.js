const fetchWorkflows = async () => {
  const response = await fetch("http://localhost:8080/api/dashboard");
  const data = await response.json();
  return data;
};

window.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("root");
  const workflows = await fetchWorkflows();

  log.debug(workflows);
  root.textContent = JSON.stringify(workflows);
});
