async function fetchClient(...args) {
  if (typeof fetch === "function") {
    return fetch(...args);
  }

  const { default: nodeFetch } = await import("node-fetch");
  return nodeFetch(...args);
}

module.exports = fetchClient;
