document.addEventListener("alpine:init", () => {
  Alpine.store("app", {
    init() {
      this.getSettingsFromStorage()
      this.getResultsFromStorage()
    },
    settings: defaultSettings,
    get header() {
      return this.settings.filter((x) => x.display)
    },
    initialHeaderForSettingsList: defaultSettings,
    results: [],
    addResult(selectedLane, selectedThrowScore) {
      this.results.push({
        lane: selectedLane,
        throwScore: parseInt(selectedThrowScore),
      })
      this.persistResults()
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
    renderTableFromRawResults() {
      const userRow = this.settings
        .filter((setting) => setting.display)
        .map((setting) => setting.id)
      return this.results.map((_, i) => {
        const renderFuncsForRow = this.getRenderFuncsForRow(i)
        return userRow.map((columnId) => renderFuncsForRow[columnId]())
      })
    },
    exportAsTSV() {
      const completedTable = this.renderTableFromRawResults()
      const date = getFormattedDate()
      const rows = completedTable
        .map((row) => {
          const rowArray = Object.values(row)
          rowArray.unshift(date)
          return rowArray.join("\t")
        })
        .join("\n")
      const header = this.header.map(c=>c.label)
      header.unshift(labels.date)
      const tsv = [header.join("\t"), rows].join("\n")
      downloadBlob(
        tsv,
        `${date}.tsv`,
        "text/tab-separated-values;charset=utf-8;"
      )
    },
    deleteResults() {
      this.results.splice(0, this.results.length)
      localStorage.removeItem("results")
    },
    deleteLastThrow() {
      this.results.pop()
      this.persistResults()
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
  deleteLast: "Letzten Wurf löschen",
  configure: "Tabelle konfigurieren",
  close: "Schliessen",
  reset: "Zurücksetzen",
  settings: "Einstellungen",
  date: "Datum"
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

const downloadBlob = function (content, filename, contentType) {
  var blob = new Blob([content], { type: contentType })
  var url = URL.createObjectURL(blob)

  var pom = document.createElement("a")
  pom.href = url
  pom.setAttribute("download", filename)
  pom.click()
}
