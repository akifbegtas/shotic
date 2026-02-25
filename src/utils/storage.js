let _asyncStorage = null;
try { _asyncStorage = require("@react-native-async-storage/async-storage").default; } catch (e) {}

export const SafeStorage = {
  getItem: async (key) => { try { return _asyncStorage ? await _asyncStorage.getItem(key) : null; } catch (e) { return null; } },
  setItem: async (key, val) => { try { if (_asyncStorage) await _asyncStorage.setItem(key, val); } catch (e) {} },
};
