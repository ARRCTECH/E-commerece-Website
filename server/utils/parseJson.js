// Helper to parse JSON fields safely
const parseJson = (data, fallback) => {
  try {
    return JSON.parse(data)
  } catch {
    return fallback
  }
}

module.exports = parseJson
