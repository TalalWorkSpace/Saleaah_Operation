/* ═══════════════════════════════════════════════════════════
   سلعة — Code.gs
   Server-side: doGet, Wrappers, Logging, Stats
   ═══════════════════════════════════════════════════════════ */

var MAIN_SHEET = "Main";
var LOG_SHEET = "Operations_Log";
var LOG_HEADERS = [
  "Timestamp",
  "Task",
  "Status",
  "Details",
  "Duration(ms)",
  "User",
];

// ─── نشر الواجهة ─────────────────────────────────────────

function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("\u0633\u0644\u0639\u0629 \u2014 لوحة التحكم")
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    )
    .addMetaTag(
      "viewport",
      "width=device-width,initial-scale=1"
    );
}

// ─── ورقة السجل ──────────────────────────────────────────

function _getLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOG_SHEET);
    sh.appendRow(LOG_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, LOG_HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#745ff2")
      .setFontColor("#ffffff");
    sh.setColumnWidth(1, 170);
    sh.setColumnWidth(2, 160);
    sh.setColumnWidth(4, 340);
  }
  return sh;
}

function _writeLog(task, status, details, duration, user) {
  var sh = _getLogSheet();
  sh.appendRow([
    new Date(),
    task,
    status,
    String(details || "").slice(0, 1000),
    duration,
    user,
  ]);
}

// ─── الحصول على المستخدم ─────────────────────────────────

function _currentUser() {
  try {
    return Session.getActiveUser().getEmail() || "webapp";
  } catch (_) {
    return "webapp";
  }
}

// ─── Wrapper عام ─────────────────────────────────────────

function _runWrapped(taskLabel, fn) {
  var start = Date.now();
  var user = _currentUser();
  try {
    var result = fn();
    var dur = Date.now() - start;
    var detail =
      result !== undefined && result !== null
        ? typeof result === "object"
          ? JSON.stringify(result)
          : String(result)
        : "OK";
    _writeLog(taskLabel, "OK", detail, dur, user);
    return {
      ok: true,
      message: detail,
      duration: dur,
    };
  } catch (e) {
    var dur = Date.now() - start;
    _writeLog(taskLabel, "ERR", e.message, dur, user);
    return {
      ok: false,
      message: e.message,
      duration: dur,
    };
  }
}

// ─── Wrappers ────────────────────────────────────────────

function opFetchUpload() {
  return _runWrapped(
    "Fetch & Upload",
    fetchTomorrowOrdersFromMain
  );
}

function opUpdateExisting() {
  return _runWrapped(
    "Update Existing",
    updateExistingShipdayOrders
  );
}

function opDistributeSweep() {
  return _runWrapped(
    "Distribute Sweep",
    distributeOrders
  );
}

function opDistributeToMain() {
  return _runWrapped(
    "Distribute to Main",
    distributeToMain
  );
}

function opSetupTrigger() {
  return _runWrapped(
    "Setup Trigger (5 min)",
    setupAutoUpdateTrigger
  );
}

function opDeleteTriggers() {
  return _runWrapped(
    "Delete Triggers",
    deleteAllUpdateTriggers
  );
}

// ─── الإحصاءات ──────────────────────────────────────────

function getStats() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(MAIN_SHEET);
    if (!sh) {
      return {
        ok: false,
        message: "ورقة Main غير موجودة",
        sentToCourier: 0,
        hasOrderId: 0,
        totalRows: 0,
      };
    }

    var lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return {
        ok: true,
        sentToCourier: 0,
        hasOrderId: 0,
        totalRows: 0,
      };
    }

    var numRows = lastRow - 1;

    // العمود G = 7 — الحالة
    var colG = sh
      .getRange(2, 7, numRows, 1)
      .getValues();
    var sentCount = 0;
    for (var i = 0; i < colG.length; i++) {
      if (
        String(colG[i][0]).trim() === "Sent to Courier"
      ) {
        sentCount++;
      }
    }

    // العمود AZ = 52 — orderId
    var colAZ = sh
      .getRange(2, 52, numRows, 1)
      .getValues();
    var orderIdCount = 0;
    for (var j = 0; j < colAZ.length; j++) {
      if (String(colAZ[j][0]).trim() !== "") {
        orderIdCount++;
      }
    }

    return {
      ok: true,
      sentToCourier: sentCount,
      hasOrderId: orderIdCount,
      totalRows: numRows,
    };
  } catch (e) {
    return {
      ok: false,
      message: e.message,
      sentToCourier: 0,
      hasOrderId: 0,
      totalRows: 0,
    };
  }
}

// ─── آخر السجلات ────────────────────────────────────────

function getRecentLogs(limit) {
  limit = limit || 12;
  try {
    var sh = _getLogSheet();
    var lastRow = sh.getLastRow();
    if (lastRow < 2) {
      return { ok: true, logs: [] };
    }

    var startRow = Math.max(2, lastRow - limit + 1);
    var numRows = lastRow - startRow + 1;
    var data = sh
      .getRange(startRow, 1, numRows, 6)
      .getValues();

    var logs = [];
    for (var i = data.length - 1; i >= 0; i--) {
      var row = data[i];
      var ts =
        row[0] instanceof Date
          ? row[0].toISOString()
          : String(row[0]);
      logs.push({
        timestamp: ts,
        task: String(row[1]),
        status: String(row[2]),
        details: String(row[3]),
        duration: Number(row[4]) || 0,
        user: String(row[5]),
      });
    }

    return { ok: true, logs: logs };
  } catch (e) {
    return { ok: false, logs: [], message: e.message };
  }
}
