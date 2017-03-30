export default {
  getItem (key) {
    const data = window.localStorage.getItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch (e) {
        return undefined
      }
    }
  },

  setItem (key, val) {
    window.localStorage.setItem(key, JSON.stringify(val))
  },

  clear (prefix) {
    const matchingKeys = []
    for (var i = 0; i < window.localStorage.length; i++) {
      matchingKeys.push(window.localStorage.key(i))
    }

    matchingKeys.forEach(key => window.localStorage.removeItem(key))
  }
}
