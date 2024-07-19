document.addEventListener("alpine:init", () => {
  Alpine.store("app", {
    init() {
      this.getSettingsFromStorage()
      this.getResultsFromStorage()
      this.throwCounter = getCurrentLaneThrows(this.results, this.selectedLane)
    },
    settings: defaultSettings,
    get header() {
      return this.settings.filter((x) => x.display)
    },
    initialHeaderForSettingsList: defaultSettings,
    results: [],
    isRightLaneSelected: false,
    get selectedLane() {
      return this.isRightLaneSelected ? "right" : "left"
    },
    throwCounter: 0,
    addResult(selectedThrowScore) {
      this.ensureCorrectLane()
      this.results.push({
        lane: this.selectedLane,
        throwScore: parseInt(selectedThrowScore),
      })
      this.persistResults()
    },
    ensureCorrectLane() {
      const previouslyPlayedLane = this.results.length
        ? this.results[this.results.length - 1].lane
        : this.selectedLane
      const hasJustBeenToggled = this.selectedLane !== previouslyPlayedLane
      if (hasJustBeenToggled) this.resetThrowCounter()
      this.throwCounter++
      // switch lane every 15 throws
      if (this.throwCounter === 16) {
        this.isRightLaneSelected = !this.isRightLaneSelected
        this.throwCounter = 1
      }
    },
    resetThrowCounter() {
      this.throwCounter = 0
    },
    getRenderFuncsForRow(i) {
      const resultForRow = this.results[i]
      return {
        throwNumber: () => i + 1,
        throwScore: () => resultForRow.throwScore,
        sum: () => sumUpResultForLine(this.results, i),
        lane: () => labels[resultForRow.lane],
        average: () => getAverageForLine(this.results, i),
        sevenAverageDiff: () => getSevenAverageDiffForLine(this.results, i),
      }
    },
    renderTableFromRawResults({ forExport } = {}) {
      const userRow = this.settings
        .filter((setting) => setting.display)
        .map((setting) => setting.id)
      return this.results.map((_, i) => {
        const renderFuncsForRow = this.getRenderFuncsForRow(i)
        return forExport
          ? userRow.reduce(
            (rowObject, columnId) => {
              rowObject[labels[columnId]] = renderFuncsForRow[columnId]()
              return rowObject
            },
            { [labels.date]: getFormattedDate() }
          )
          : userRow.map((columnId) => renderFuncsForRow[columnId])
      })
    },
    exportFile() {
      const completedTable = this.renderTableFromRawResults({ forExport: true })
      const worksheet = XLSX.utils.json_to_sheet(completedTable)

      // Create a new workbook and append the worksheet
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1")

      // Create XLSX file and initiate download
      const xlsData = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "binary",
      })

      downloadBlob(s2ab(xlsData), `${getFormattedDate()}.xlsx`, "application/octet-stream")
    },
    deleteResults() {
      this.results.splice(0, this.results.length)
      this.isRightLaneSelected = false
      this.resetThrowCounter()
      localStorage.removeItem("results")
    },
    deleteLastThrow() {
      if (confirm(labels.confirmDelete)) {
        this.results.pop()
        this.persistResults()
      }
    },
    persistResults() {
      localStorage.setItem("results", JSON.stringify(this.results))
    },
    persistSettings() {
      localStorage.setItem("settings", JSON.stringify(this.settings))
    },
    resetSettings() {
      this.settings = defaultSettings
      localStorage.removeItem("settings")
    },
    handleColumnSettingsDrag() {
      return function (columnId, position) {
        const newSettings = this.settings.slice()
        const fromIndex = newSettings.findIndex((item) => item.id === columnId)
        const cutItem = newSettings.splice(fromIndex, 1)[0]
        newSettings.splice(position, 0, cutItem)
        this.settings = newSettings
        this.persistSettings()
      }.bind(this)
    },
    getResultsFromStorage() {
      const results = localStorage.getItem("results")
      if (!results) return []
      this.results = JSON.parse(results)
    },
    getSettingsFromStorage() {
      const settings = localStorage.getItem("settings")
      if (!settings) return defaultSettings
      const parsed = JSON.parse(settings)
      this.settings = parsed
      this.initialHeaderForSettingsList = parsed
    },
    getClickHandlerForColumnSetting(columnId) {
      return function (e) {
        const setting = this.settings.find((s) => s.id === columnId)
        setting.display = e.target.checked
        this.persistSettings()
      }.bind(this)
    },
  })
})

const labels = {
  left: "links",
  right: "rechts",
  toggleLeft: "L",
  toggleRight: "R",
  throwScore: "Holz",
  sum: "Summe",
  lane: "Gasse",
  sevenAverageDiff: "7er-Diff",
  average: "Schnitt",
  addThrow: "Wurf hinzufügen",
  export: "Exportieren",
  throwNumber: "Wurf",
  delete: "Tabelle löschen",
  deleteLast: "🗑️",
  configure: "Tabelle konfigurieren",
  close: "Schliessen",
  reset: "Zurücksetzen",
  settings: "Einstellungen",
  date: "Datum",
  confirmDelete: "Letzten Wurf wirklich löschen?",
}

const defaultSettings = [
  {
    id: "throwNumber",
    label: labels.throwNumber,
    display: true,
  },
  {
    id: "throwScore",
    label: labels.throwScore,
    display: true,
  },
  {
    id: "sum",
    label: labels.sum,
    display: true,
  },
  {
    id: "lane",
    label: labels.lane,
    display: true,
  },
  {
    id: "average",
    label: labels.average,
    display: true,
  },
  {
    id: "sevenAverageDiff",
    label: labels.sevenAverageDiff,
    display: true,
  },
]

const sumUpResultForLine = function (allResults, i) {
  return allResults
    .map((x) => x.throwScore)
    .slice(0, i + 1)
    .reduce((prev, curr) => prev + curr, 0)
}

const getAverageForLine = function (allResults, i) {
  const sum = sumUpResultForLine(allResults, i)
  const avg = sum / (i + 1)
  return avg.toFixed(2)
}

const getSevenAverageDiffForLine = function (results, i) {
  const sevenAverageSum = (i + 1) * 7
  const actualSum = sumUpResultForLine(results, i)
  const diff = sevenAverageSum - actualSum
  // we want to display the number as negative when actual score is low
  return -diff
}

const getFormattedDate = function () {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const downloadBlob = function (blobData, filename, contentType) {
  const blob = new Blob([blobData], {
    type: contentType,
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getCurrentLaneThrows = function (results, selectedLane) {
  let count = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i].lane === selectedLane) {
      count++
    } else {
      break
    }
  }
  return count
}

const s2ab = function (s) {
  const buf = new ArrayBuffer(s.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xff
  }
  return buf
}
