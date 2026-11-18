(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MC3D_UNSAVED = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function canonicalize(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? (value === 0 ? 0 : value) : null;
    if (typeof value === 'boolean' || typeof value === 'string') return value;
    if (typeof value.toJSON === 'function') return canonicalize(value.toJSON());
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return item === undefined ? null : canonicalize(item);
      });
    }
    if (typeof value === 'object') {
      const out = {};
      const keys = Object.keys(value).sort();
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = value[k];
        if (v !== undefined && typeof v !== 'function' && typeof v !== 'symbol') {
          out[k] = canonicalize(v);
        }
      }
      return out;
    }
    return null;
  }

  function stableStringify(value) {
    return JSON.stringify(canonicalize(value));
  }

  function serializeModelSnapshot(state, name) {
    return stableStringify({
      name: typeof name === 'string' ? name : '',
      state: state || null
    });
  }

  function createUnsavedTracker() {
    let cleanSig = null;
    let pendingLocalSave = false;
    let pendingCloudSync = false;
    let saveFailed = false;
    let bypassUnload = false;

    function markClean(state, name) {
      cleanSig = serializeModelSnapshot(state, name);
      pendingLocalSave = false;
      saveFailed = false;
      bypassUnload = false;
      return cleanSig;
    }

    function setLocalSaveStatus(status) {
      if (!status || typeof status !== 'object') return;
      if (typeof status.pending === 'boolean') {
        pendingLocalSave = status.pending;
      }
      if (typeof status.ok === 'boolean') {
        saveFailed = !status.ok;
      }
    }

    function setCloudStatus(status) {
      if (!status || typeof status !== 'object') return;
      if (typeof status.pending === 'boolean') {
        pendingCloudSync = status.pending;
      }
    }

    function suppressNextUnload() {
      bypassUnload = true;
    }

    function clearSuppression() {
      bypassUnload = false;
    }

    function hasUnsavedChanges(state, name, activeGesture) {
      if (bypassUnload) return false;
      if (activeGesture) return true;
      if (saveFailed) return true;
      if (pendingLocalSave || pendingCloudSync) return true;
      if (cleanSig === null) return false;
      return serializeModelSnapshot(state, name) !== cleanSig;
    }

    function handleBeforeUnload(event, state, name, activeGesture) {
      if (!hasUnsavedChanges(state, name, activeGesture)) {
        return false;
      }
      if (event && typeof event === 'object') {
        if (typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        event.returnValue = '';
      }
      return true;
    }

    function getStatus() {
      return {
        cleanSig,
        pendingLocalSave,
        pendingCloudSync,
        saveFailed,
        bypassUnload
      };
    }

    return {
      markClean,
      setLocalSaveStatus,
      setCloudStatus,
      suppressNextUnload,
      clearSuppression,
      hasUnsavedChanges,
      handleBeforeUnload,
      getStatus
    };
  }

  return {
    stableStringify,
    serializeModelSnapshot,
    createUnsavedTracker
  };
});
