/* ============================================================================
   Cisco Benefits Dashboard - chart helpers.
   Thin Chart.js wrappers using the Cisco brand palette so every chart on every
   tab inherits the same visual language without per-page boilerplate.
   ========================================================================== */

(function () {
  'use strict';

  // Cisco brand palette + status accents. Order is deliberately chosen so
  // stacked bars step through it in a way that matches typical hierarchy
  // (Medical / Pension / Statutory first).
  var PALETTE = [
    '#005073', // Cisco Indigo
    '#00bceb', // Cisco Blue
    '#6abf4b', // Cisco Green
    '#fbab18', // Cisco Yellow
    '#e2231a', // Cisco Red
    '#7c4dff', // Cisco accent purple
    '#049fd9', // Cisco bright blue
    '#58585b', // Cisco gray-700
    '#00374f', // Cisco indigo-900
    '#c6c7ca', // Cisco gray-300
  ];

  var TONE = {
    success: '#6abf4b',
    info:    '#00bceb',
    warning: '#fbab18',
    danger:  '#e2231a',
    neutral: '#58585b',
    primary: '#005073',
  };

  function commonOptions(opts) {
    opts = opts || {};
    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: opts.horizontal ? 'y' : 'x',
      plugins: {
        legend: {
          display: opts.legend !== false,
          position: 'bottom',
          labels: {
            font: { family: getComputedStyle(document.body).fontFamily, size: 11 },
            color: '#58585b',
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 55, 79, 0.92)',
          padding: 10,
          titleFont: { weight: '600', size: 12 },
          bodyFont: { size: 12 },
          cornerRadius: 4,
          callbacks: {
            label: function (ctx) {
              var v = ctx.parsed[opts.horizontal ? 'x' : 'y'];
              if (v === null || v === undefined) return ctx.dataset.label + ': —';
              var s = formatValue(v, opts.valueFormat);
              return ctx.dataset.label ? ctx.dataset.label + ': ' + s : s;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: !!opts.stacked,
          grid: {
            color: '#ebebeb',
            drawBorder: false,
          },
          ticks: {
            color: '#6e6e73',
            font: { size: 11 },
            callback: function (val, idx, ticks) {
              if (opts.horizontal) return formatValue(val, opts.valueFormat);
              return this.getLabelForValue(val);
            },
          },
        },
        y: {
          stacked: !!opts.stacked,
          grid: {
            color: '#ebebeb',
            drawBorder: false,
          },
          ticks: {
            color: '#6e6e73',
            font: { size: 11 },
            callback: function (val, idx, ticks) {
              if (opts.horizontal) return this.getLabelForValue(val);
              return formatValue(val, opts.valueFormat);
            },
          },
          max: opts.max,
          min: opts.min,
        },
      },
    };
  }

  function formatValue(v, fmt) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    if (fmt === 'percent') return v.toFixed(1) + '%';
    if (fmt === 'percent0') return Math.round(v) + '%';
    if (fmt === 'usdM') {
      if (v >= 1000) return '$' + (v / 1000).toFixed(2) + 'B';
      return '$' + v.toFixed(1) + 'M';
    }
    if (fmt === 'usd') {
      if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
      if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
      if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
      return '$' + Math.round(v).toLocaleString();
    }
    if (Math.abs(v) >= 10000) return Math.round(v).toLocaleString();
    if (Math.abs(v) >= 100) return v.toLocaleString();
    if (Math.abs(v) < 10 && v % 1 !== 0) return v.toFixed(2);
    return v.toString();
  }

  /**
   * Render a Chart.js bar chart.
   *   id        - canvas element id
   *   labels    - category labels (string[])
   *   series    - [{ name, data: number[], color?, tone? }]
   *   options   - { stacked, horizontal, normalized, valueFormat, legend, max, min, height }
   */
  function bar(id, labels, series, options) {
    options = options || {};
    var el = document.getElementById(id);
    if (!el) return;

    if (typeof Chart === 'undefined') {
      console.warn('Chart.js missing — skipping ' + id);
      el.parentNode.innerHTML =
        '<div class="footnote">Chart unavailable (Chart.js failed to load).</div>';
      return;
    }

    if (options.height) {
      el.height = options.height;
      el.style.height = options.height + 'px';
    }

    var datasets = series.map(function (s, i) {
      var color = s.color || (s.tone && TONE[s.tone]) || PALETTE[i % PALETTE.length];
      return {
        label: s.name,
        data: s.data,
        backgroundColor: color,
        hoverBackgroundColor: color,
        borderColor: color,
        borderWidth: 0,
        borderRadius: 2,
        maxBarThickness: 32,
      };
    });

    // normalized: convert each category's stack to percent-of-total
    if (options.normalized) {
      var totals = labels.map(function (_, ci) {
        return datasets.reduce(function (a, d) { return a + (d.data[ci] || 0); }, 0);
      });
      datasets = datasets.map(function (d) {
        return Object.assign({}, d, {
          data: d.data.map(function (v, ci) {
            return totals[ci] > 0 ? (v / totals[ci]) * 100 : 0;
          }),
        });
      });
      options.valueFormat = 'percent';
      options.stacked = true;
      options.max = 100;
    }

    var opt = commonOptions(options);
    return new Chart(el, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: opt,
    });
  }

  // Public surface
  window.CiscoChart = {
    bar: bar,
    palette: PALETTE,
    tone: TONE,
  };
})();
