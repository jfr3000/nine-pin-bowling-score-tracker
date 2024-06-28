'use strict'

 const labels = {
  left: 'links',
  right: 'rechts',
  throwScore: 'Holz',
  sum: 'Summe',
  lane: 'Gasse',
  sevenAverage: '7er-Schnitt',
  average: 'Schnitt',
  addThrow: 'Wurf hinzufügen',
  export: 'Exportieren'
}

 const sumUpResultForLine = function (allResults, i) {
  return allResults
    .map(x => x.throwScore)
    .slice(0, i + 1)
    .reduce((prev, curr) => prev + curr, 0)
}

 const getAverageForLine = function (allResults, i) {
  const sum = sumUpResultForLine(allResults, i)
  return sum/(i+1)
}

 const addResult = function (selectedLane, selectedThrowScore, results) {
  results.push({ lane: selectedLane, throwScore: parseInt(selectedThrowScore) })
}

const renderTableFromRawResults = function (results) {
  return results.map((result, i) => {
    return {
      throwScore: result.throwScore,
      sum: sumUpResultForLine(results, i),
      lane: labels[result.lane],
      sevenAverage: (i + 1) * 7,
      average: getAverageForLine(results, i)
    }
  })
}

const header = [labels.throwScore, labels.sum, labels.lane, labels.sevenAverage, labels.average]

const exportAsTSV = function (results) {
  const completedTable = renderTableFromRawResults(results)
  const rows = completedTable.map(row => {
    return Object.values(row).join('\t');
  }).join('\n')
  const tsv = [header.join('\t'), rows].join('\n')
  downloadBlob(tsv, `${getFormattedDateTime()}.tsv`, 'text/tab-separated-values;charset=utf-8;')
}

function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hours}_${minutes}`;
}

const downloadBlob = function (content, filename, contentType) {
  var blob = new Blob([content], { type: contentType })
  var url = URL.createObjectURL(blob)

  var pom = document.createElement('a')
  pom.href = url
  pom.setAttribute('download', filename)
  pom.click()
}
