/**
 * localStorage helpers.
 * Zustand's persist middleware handles most storage automatically.
 * These helpers are for manual export/import of game data.
 */

export function exportJSON(key, filename) {
  const data = localStorage.getItem(key)
  if (!data) return
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${key}-export.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        resolve(JSON.parse(e.target.result))
      } catch {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file)
  })
}

export function clearAllData() {
  localStorage.removeItem('riichi-profile')
  localStorage.removeItem('riichi-game')
}
