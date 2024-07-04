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
  deleteLast: "Letzten Wurf löschen"
}

const sumUpResultForLine = function (allResults, i) {
  return allResults
    .map((x) => x.throwScore)
    .slice(0, i + 1)
    .reduce((prev, curr) => prev + curr, 0)
}

const getAverageForLine = function (allResults, i) {
  const sum = sumUpResultForLine(allResults, i)
  const avg = sum / (i + 1)
  return Math.round(avg * 10) / 10
}

const getSevenAverageDiffForLine = function (results, i) {
  const sevenAverageSum = (i + 1) * 7
  const actualSum = sumUpResultForLine(results, i)
  const diff = sevenAverageSum - actualSum
  // we want to display the number as negative when actual score is low
  return -diff
}

// eslint-disable-next-line no-unused-vars
const addResult = function (selectedLane, selectedThrowScore, results) {
  results.push({
    lane: selectedLane,
    throwScore: parseInt(selectedThrowScore),
  })
  persistResults(results)
}

const renderTableFromRawResults = function (results) {
  return results.map((result, i) => {
    return {
      throwNumber: i + 1,
      throwScore: result.throwScore,
      sum: sumUpResultForLine(results, i),
      lane: labels[result.lane],
      average: getAverageForLine(results, i),
      sevenAverageDiff: getSevenAverageDiffForLine(results, i),
    }
  })
}

const header = [
  labels.throwNumber,
  labels.throwScore,
  labels.sum,
  labels.lane,
  labels.average,
  labels.sevenAverageDiff,
]

// eslint-disable-next-line no-unused-vars
const exportAsTSV = function (results) {
  const completedTable = renderTableFromRawResults(results)
  const rows = completedTable
    .map((row) => {
      return Object.values(row).join("\t")
    })
    .join("\n")
  const tsv = [header.join("\t"), rows].join("\n")
  downloadBlob(
    tsv,
    `${getFormattedDateTime()}.tsv`,
    "text/tab-separated-values;charset=utf-8;"
  )
}

function getFormattedDateTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")

  return `${year}-${month}-${day}-${hours}_${minutes}`
}

const downloadBlob = function (content, filename, contentType) {
  var blob = new Blob([content], { type: contentType })
  var url = URL.createObjectURL(blob)

  var pom = document.createElement("a")
  pom.href = url
  pom.setAttribute("download", filename)
  pom.click()
}

const persistResults = function(results) {
  localStorage.setItem('results', JSON.stringify(results))
}

// eslint-disable-next-line no-unused-vars
const getResultsFromStorage = function () {
  const results = localStorage.getItem('results')
  if (!results) return []
  return JSON.parse(results)
}

// eslint-disable-next-line no-unused-vars
const deleteResults = function (results) {
  results.splice(0, results.length)
  localStorage.removeItem('results')
}

// eslint-disable-next-line no-unused-vars
const deleteLastThrow = function (results) {
  results.pop()
}
