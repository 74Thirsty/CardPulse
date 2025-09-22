const { valuations, cards } = require('../store');

function getValuation(cardId) {
  const record = valuations[cardId];
  if (!record) {
    return null;
  }
  const card = cards.find((item) => item.id === cardId) || null;
  const history = Array.isArray(record.history) ? [...record.history] : [];
  if (history.length === 0) {
    return {
      card: card ? { ...card } : null,
      history: [],
      average: null,
      lowest: null,
      highest: null,
      change30d: null,
      change7d: null,
      average7d: null,
      average30d: null,
      volume30d: null,
      sources: record.sources || [],
    };
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  const latest = history[history.length - 1];
  const history7 = history.slice(-7);
  const history30 = history.slice(-30);

  const change7d = computeChange(history7);
  const change30d = computeChange(history30);
  const average7d = computeAverage(history7);
  const average30d = computeAverage(history30);
  const lowest = computeLowest(history30);
  const highest = computeHighest(history30);
  const volume30d = computeVolume(history30);

  const cardDetails = card ? { ...card } : null;

  return {
    card: cardDetails,
    history,
    average: latest.average,
    lowest,
    highest,
    change30d,
    change7d,
    average7d,
    average30d,
    volume30d,
    sources: record.sources || [],
  };
}

function computeChange(points) {
  if (!points || points.length < 2) {
    return null;
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (!first.average) {
    return null;
  }
  const delta = ((last.average - first.average) / first.average) * 100;
  return Number(delta.toFixed(2));
}

function computeAverage(points) {
  if (!points || points.length === 0) {
    return null;
  }
  const sum = points.reduce((acc, point) => acc + (point.average || 0), 0);
  const avg = sum / points.length;
  return Number(avg.toFixed(2));
}

function computeLowest(points) {
  if (!points || points.length === 0) {
    return null;
  }
  const min = Math.min(...points.map((point) => point.lowest ?? point.average));
  return Number(min.toFixed(2));
}

function computeHighest(points) {
  if (!points || points.length === 0) {
    return null;
  }
  const max = Math.max(...points.map((point) => point.highest ?? point.average));
  return Number(max.toFixed(2));
}

function computeVolume(points) {
  if (!points || points.length === 0) {
    return null;
  }
  const sum = points.reduce((acc, point) => acc + (point.volume || 0), 0);
  return sum;
}

module.exports = {
  getValuation,
};
