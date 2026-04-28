// ActionLogger.js
function nowStr() { return Qt.formatDateTime(new Date(), "hh:mm:ss") }

function push(model, text, maxItems) {
  model.insert(0, { text: text, ts: nowStr() })
  if (maxItems && model.count > maxItems) {
    model.remove(maxItems, model.count - maxItems)
  }
}
