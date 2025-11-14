(function () {
  const SELECTOR = '[data-noaa-meteogram]';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HOURS_TO_SHOW = 48;
  const MS_PER_HOUR = 60 * 60 * 1000;
  const MPH_PER_KNOT = 1.15078;

  function init() {
    const widgets = document.querySelectorAll(SELECTOR);
    if (!widgets.length) {
      return;
    }
    widgets.forEach((widget) => {
      const lat = parseFloat(widget.dataset.lat);
      const lon = parseFloat(widget.dataset.lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        widget.innerHTML = '<p class="meteogram-error">Unable to load NOAA data for this location.</p>';
        return;
      }
      loadForecast(widget, lat, lon);
    });
  }

  async function loadForecast(container, lat, lon) {
    setStatus(container, 'Loading launch window forecast…');
    try {
      const baseForecast = await fetchForecast(lat, lon);
      const range = getLaunchWindowRange();
      const points = buildPoints(baseForecast.grid, range);
      if (!points.length) {
        throw new Error('Launch window data unavailable.');
      }
      const forecast = {
        ...baseForecast,
        points,
        range
      };
      container.innerHTML = '';
      container.appendChild(buildRangeLabel(forecast));
      container.appendChild(buildSummary(forecast));
      container.appendChild(buildChart(forecast));
      container.appendChild(buildUpdatedStamp(forecast));
    } catch (error) {
      console.error('NOAA meteogram failed', error);
      container.innerHTML = '<p class="meteogram-error">NOAA data is temporarily unavailable. Try refreshing in a minute.</p>';
    }
  }

  function setStatus(container, text) {
    container.innerHTML = `<p class="meteogram-loading">${text}</p>`;
  }

  async function fetchForecast(lat, lon) {
    const pointResponse = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    if (!pointResponse.ok) {
      throw new Error('Unable to locate grid point.');
    }
    const pointData = await pointResponse.json();
    const gridUrl = pointData.properties.forecastGridData;
    if (!gridUrl) {
      throw new Error('Grid forecast not available.');
    }
    const hourlyUrl = pointData.properties.forecastHourly;
    const gridPromise = fetch(gridUrl);
    const hourlyPromise = hourlyUrl ? fetch(hourlyUrl) : Promise.resolve(null);
    const [gridResponse, hourlyResponse] = await Promise.all([gridPromise, hourlyPromise]);
    if (!gridResponse.ok) {
      throw new Error('Unable to download grid forecast.');
    }
    const gridData = await gridResponse.json();
    let updated;
    if (hourlyResponse && hourlyResponse.ok) {
      const hourlyData = await hourlyResponse.json();
      updated = hourlyData.properties?.updated;
    }
    if (!updated) {
      updated = gridData.properties?.updateTime || gridData.properties?.updated;
    }
    return {
      city: pointData.properties.relativeLocation?.properties?.city || 'Ann Arbor',
      state: pointData.properties.relativeLocation?.properties?.state || 'MI',
      grid: gridData.properties,
      updated
    };
  }

  function getLaunchWindowRange(referenceDate = new Date()) {
    const start = new Date(referenceDate);
    start.setMinutes(0, 0, 0);
    const day = start.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7;
    start.setDate(start.getDate() + daysUntilSaturday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + HOURS_TO_SHOW * MS_PER_HOUR - 1);
    return { start, end };
  }

  function buildPoints(grid, range) {
    if (!grid) {
      return [];
    }
    const hours = Array.from({ length: HOURS_TO_SHOW }, (_, index) => new Date(range.start.getTime() + index * MS_PER_HOUR));
    const temperature = expandValues(grid.temperature?.values, convertCtoF);
    const windChill = expandValues(grid.windChill?.values, convertCtoF);
    const windSpeed = expandValues(grid.windSpeed?.values, convertKnotsToMph);
    const windGust = expandValues(grid.windGust?.values, convertKnotsToMph);
    const precipitation = expandValues(grid.probabilityOfPrecipitation?.values, (v) => v);
    const humidity = expandValues(grid.relativeHumidity?.values, (v) => v);

    return hours.map((date) => {
      const iso = date.toISOString();
      const temp = temperature.get(iso);
      const sustained = windSpeed.get(iso);
      const gust = windGust.get(iso);
      let chill = windChill.get(iso);
      if ((chill === undefined || chill === null) && typeof temp === 'number' && typeof sustained === 'number') {
        chill = computeWindChill(temp, sustained);
      }
      return {
        date,
        temp: typeof temp === 'number' ? temp : null,
        chill: typeof chill === 'number' ? chill : null,
        wind: typeof sustained === 'number' ? sustained : null,
        gust: typeof gust === 'number' ? gust : typeof sustained === 'number' ? sustained : null,
        precip: clampPercent(precipitation.get(iso)),
        humidity: clampPercent(humidity.get(iso))
      };
    });
  }

  function expandValues(values = [], convert = (value) => value) {
    const map = new Map();
    values.forEach((entry) => {
      if (entry.value === null || entry.value === undefined || !entry.validTime) {
        return;
      }
      const { start, durationHours } = parseValidTime(entry.validTime);
      if (!start || !durationHours) {
        return;
      }
      const convertedValue = convert(entry.value);
      const steps = Math.max(1, Math.round(durationHours));
      for (let hour = 0; hour < steps; hour += 1) {
        const time = new Date(start.getTime() + hour * MS_PER_HOUR);
        map.set(time.toISOString(), convertedValue);
      }
    });
    return map;
  }

  function parseValidTime(value) {
    const [startString, durationString] = value.split('/');
    const start = startString ? new Date(startString) : null;
    const durationHours = parseDurationToHours(durationString);
    return { start, durationHours };
  }

  function parseDurationToHours(duration = '') {
    const match = duration.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) {
      return 0;
    }
    const days = Number(match[1] || 0);
    const hours = Number(match[2] || 0);
    const minutes = Number(match[3] || 0);
    return days * 24 + hours + minutes / 60;
  }

  function convertCtoF(value) {
    return value * 9 / 5 + 32;
  }

  function convertKnotsToMph(value) {
    return value * MPH_PER_KNOT;
  }

  function clampPercent(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  }

  function buildRangeLabel(forecast) {
    const label = document.createElement('p');
    label.className = 'meteogram-range-label';
    label.textContent = `Launch window: ${formatRange(forecast.range.start)} – ${formatRange(forecast.range.end)}`;
    return label;
  }

  function buildSummary(forecast) {
    const summary = document.createElement('div');
    summary.className = 'meteogram-summary';
    const saturday = forecast.points.filter((point) => isSameDay(point.date, forecast.range.start));
    const sundayStart = new Date(forecast.range.start.getTime() + 24 * MS_PER_HOUR);
    const sunday = forecast.points.filter((point) => isSameDay(point.date, sundayStart));
    summary.appendChild(summaryItem('Saturday High', formatTemp(maxValue(saturday, 'temp'))));
    summary.appendChild(summaryItem('Saturday Low', formatTemp(minValue(saturday, 'temp'))));
    summary.appendChild(summaryItem('Sunday High', formatTemp(maxValue(sunday, 'temp'))));
    summary.appendChild(summaryItem('Sunday Low', formatTemp(minValue(sunday, 'temp'))));
    summary.appendChild(summaryItem('Peak Gust', formatWind(maxValue(forecast.points, 'gust'))));
    summary.appendChild(summaryItem('Max Rain Chance', formatPercent(maxValue(forecast.points, 'precip'))));
    return summary;
  }

  function summaryItem(label, value) {
    const card = document.createElement('div');
    card.className = 'meteogram-summary-item';
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    const valueEl = document.createElement('strong');
    valueEl.textContent = value;
    card.appendChild(labelEl);
    card.appendChild(valueEl);
    return card;
  }

  function buildChart(forecast) {
    const width = 920;
    const leftMargin = 68;
    const rightMargin = 26;
    const topMargin = 18;
    const bottomMargin = 58;
    const sectionGap = 24;
    const sections = [
      {
        key: 'temperature',
        height: 150,
        label: 'Temperature / Wind Chill (°F)',
        lines: [
          { key: 'temp', className: 'meteogram-temp-line' },
          { key: 'chill', className: 'meteogram-chill-line', dashed: true }
        ]
      },
      {
        key: 'wind',
        height: 130,
        label: 'Surface Wind (mph)',
        min: 0,
        lines: [
          { key: 'wind', className: 'meteogram-wind-line' },
          { key: 'gust', className: 'meteogram-gust-line', dashed: true }
        ]
      },
      {
        key: 'moisture',
        height: 120,
        label: 'Rain Probability / Relative Humidity (%)',
        min: 0,
        max: 100,
        bars: { key: 'precip', className: 'meteogram-precip-bar' },
        lines: [{ key: 'humidity', className: 'meteogram-humidity-line' }]
      }
    ];

    const height = topMargin + sections.reduce((acc, section) => acc + section.height, 0) + sectionGap * (sections.length - 1) + bottomMargin;
    const svg = createSvgElement('svg', {
      viewBox: `0 0 ${width} ${height}`,
      class: 'meteogram-chart'
    });
    const chartTop = topMargin;
    const chartBottom = height - bottomMargin;
    const points = forecast.points;
    const innerWidth = width - leftMargin - rightMargin;
    const steps = Math.max(points.length - 1, 1);
    const xStep = innerWidth / steps;
    const xForIndex = (index) => leftMargin + index * xStep;

    // day dividers
    points.forEach((point, index) => {
      if (index === 0) {
        return;
      }
      if (!isSameDay(point.date, points[index - 1].date)) {
        const divider = createSvgElement('line', {
          x1: xForIndex(index),
          y1: chartTop,
          x2: xForIndex(index),
          y2: chartBottom,
          class: 'meteogram-day-divider'
        });
        svg.appendChild(divider);
      }
    });

    let sectionOffset = topMargin;
    sections.forEach((section) => {
      const sectionGroup = createSvgElement('g');
      const min = Number.isFinite(section.min) ? section.min : computeSectionMin(points, section);
      const max = Number.isFinite(section.max) ? section.max : computeSectionMax(points, section);
      const range = Math.max(max - min, 1);
      for (let i = 0; i <= 4; i += 1) {
        const y = sectionOffset + (section.height / 4) * i;
        const gridLine = createSvgElement('line', {
          x1: leftMargin,
          y1: y,
          x2: width - rightMargin,
          y2: y,
          class: 'meteogram-grid-line'
        });
        sectionGroup.appendChild(gridLine);
      }

      const label = createSvgElement('text', {
        x: leftMargin,
        y: sectionOffset - 6,
        class: 'meteogram-section-label'
      });
      label.textContent = section.label;
      sectionGroup.appendChild(label);

      if (section.bars) {
        const barWidth = Math.max(Math.min(xStep - 4, 18), 6);
        points.forEach((point, index) => {
          const value = point[section.bars.key];
          if (typeof value !== 'number') {
            return;
          }
          const heightPixels = ((value - min) / range) * section.height;
          const rect = createSvgElement('rect', {
            x: xForIndex(index) - barWidth / 2,
            y: sectionOffset + section.height - heightPixels,
            width: barWidth,
            height: Math.max(heightPixels, 0),
            class: section.bars.className
          });
          sectionGroup.appendChild(rect);
        });
      }

      if (section.lines) {
        section.lines.forEach((line) => {
          const path = createSvgElement('path', {
            class: line.className,
            fill: 'none'
          });
          if (line.dashed) {
            path.setAttribute('stroke-dasharray', '6 4');
          }
          const commands = buildPath(points, line.key, (value, index) => [xForIndex(index), sectionOffset + section.height - ((value - min) / range) * section.height]);
          if (commands) {
            path.setAttribute('d', commands);
            sectionGroup.appendChild(path);
          }
        });
      }

      svg.appendChild(sectionGroup);
      sectionOffset += section.height + sectionGap;
    });

    // axis labels
    points.forEach((point, index) => {
      if (index % 3 !== 0 && index !== points.length - 1) {
        return;
      }
      const label = createSvgElement('text', {
        x: xForIndex(index),
        y: height - 18,
        class: 'meteogram-axis-label'
      });
      label.textContent = formatHourLabel(point.date);
      svg.appendChild(label);
    });

    const legend = document.createElement('div');
    legend.className = 'meteogram-legend';
    legend.innerHTML = `
      <span><span class="legend-swatch temp"></span>Temperature</span>
      <span><span class="legend-swatch chill"></span>Wind Chill</span>
      <span><span class="legend-swatch wind"></span>Sustained Wind</span>
      <span><span class="legend-swatch gust"></span>Gusts</span>
      <span><span class="legend-swatch rain"></span>Rain Chance</span>
      <span><span class="legend-swatch humidity"></span>Relative Humidity</span>
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'meteogram-chart-wrapper';
    wrapper.appendChild(svg);
    wrapper.appendChild(legend);
    return wrapper;
  }

  function buildPath(points, key, position) {
    let commands = '';
    let drawing = false;
    points.forEach((point, index) => {
      const value = point[key];
      if (typeof value !== 'number') {
        drawing = false;
        return;
      }
      const [x, y] = position(value, index);
      commands += `${drawing ? 'L' : 'M'}${x},${y} `;
      drawing = true;
    });
    return commands.trim();
  }

  function computeSectionMin(points, section) {
    const values = collectSectionValues(points, section);
    if (!values.length) {
      return 0;
    }
    return Math.min(...values) - 2;
  }

  function computeSectionMax(points, section) {
    const values = collectSectionValues(points, section);
    if (!values.length) {
      return 10;
    }
    return Math.max(...values) + 2;
  }

  function collectSectionValues(points, section) {
    const values = [];
    if (section.lines) {
      section.lines.forEach((line) => {
        points.forEach((point) => {
          if (typeof point[line.key] === 'number') {
            values.push(point[line.key]);
          }
        });
      });
    }
    if (section.bars) {
      points.forEach((point) => {
        if (typeof point[section.bars.key] === 'number') {
          values.push(point[section.bars.key]);
        }
      });
    }
    return values;
  }

  function buildUpdatedStamp(forecast) {
    const stamp = document.createElement('p');
    stamp.className = 'meteogram-updated';
    const updated = forecast.updated ? new Date(forecast.updated) : new Date();
    stamp.textContent = `Updated ${formatTimestamp(updated)} • ${forecast.city}, ${forecast.state}`;
    return stamp;
  }

  function formatHourLabel(date) {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric'
    });
  }

  function formatRange(date) {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function formatTimestamp(date) {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  }

  function formatTemp(value) {
    if (typeof value !== 'number') {
      return '—';
    }
    return `${Math.round(value)}°F`;
  }

  function formatWind(value) {
    if (typeof value !== 'number') {
      return '—';
    }
    return `${Math.round(value)} mph`;
  }

  function formatPercent(value) {
    if (typeof value !== 'number') {
      return '—';
    }
    return `${Math.round(value)}%`;
  }

  function maxValue(points, key) {
    const values = points.map((point) => point[key]).filter((value) => typeof value === 'number');
    return values.length ? Math.max(...values) : null;
  }

  function minValue(points, key) {
    const values = points.map((point) => point[key]).filter((value) => typeof value === 'number');
    return values.length ? Math.min(...values) : null;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function computeWindChill(tempF, windMph) {
    if (tempF === null || windMph === null || tempF === undefined || windMph === undefined) {
      return null;
    }
    if (tempF > 50 || windMph < 3) {
      return tempF;
    }
    const chill = 35.74 + 0.6215 * tempF - 35.75 * Math.pow(windMph, 0.16) + 0.4275 * tempF * Math.pow(windMph, 0.16);
    return chill;
  }

  function createSvgElement(tag, attributes) {
    const element = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes || {}).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  document.addEventListener('DOMContentLoaded', init);
})();
