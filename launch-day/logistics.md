---
layout: spec
title: Launch Day Logistics
---

# Launch Day Logistics

<style>
.launch-status {
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  border: 2px solid transparent;
  margin-bottom: 1.5rem;
}
.launch-status.go {
  background-color: #e6f4ea;
  border-color: #2d7a36;
  color: #1e5c27;
}
.launch-status.no-go {
  background-color: #fdecea;
  border-color: #c62828;
  color: #7a0c0c;
}
.launch-status small {
  display: block;
  font-weight: normal;
  margin-top: 0.4rem;
}
.forecast-frame {
  margin-top: 1.5rem;
}

.meteogram-card {
  border: 1px solid #d0d7de;
  border-radius: 16px;
  padding: 1.5rem;
  background: #fff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
}

.meteogram-range-label {
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.85rem;
}

.meteogram-body {
  min-height: 340px;
}

.meteogram-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.9rem;
  margin-bottom: 1rem;
}

.meteogram-summary-item {
  border-radius: 10px;
  padding: 0.9rem 1rem;
  background: #f6f8fa;
  border: 1px solid #e2e8f0;
}

.meteogram-summary-item span {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #5f6c7b;
  margin-bottom: 0.2rem;
}

.meteogram-summary-item strong {
  font-size: 1.35rem;
  color: #0f172a;
}

.meteogram-chart-wrapper {
  width: 100%;
  margin-top: 1.5rem;
}

.meteogram-chart {
  width: 100%;
  height: auto;
  display: block;
}

.meteogram-grid-line {
  stroke: #d0d7de;
  stroke-dasharray: 3 3;
  stroke-width: 1;
}

.meteogram-day-divider {
  stroke: #e2e8f0;
  stroke-width: 2;
}

.meteogram-section-label {
  fill: #475467;
  font-size: 0.82rem;
  font-weight: 600;
}

.meteogram-temp-line {
  stroke: #d92c2c;
  stroke-width: 3;
}

.meteogram-chill-line {
  stroke: #6f42c1;
  stroke-width: 2.5;
}

.meteogram-wind-line {
  stroke: #0057b7;
  stroke-width: 3;
}

.meteogram-gust-line {
  stroke: #003566;
  stroke-width: 2;
}

.meteogram-humidity-line {
  stroke: #0c7c59;
  stroke-width: 2.5;
}

.meteogram-precip-bar {
  fill: rgba(31, 136, 61, 0.35);
}

.meteogram-axis-label {
  font-size: 0.78rem;
  fill: #475467;
  text-anchor: middle;
}

.meteogram-loading,
.meteogram-error {
  text-align: center;
  padding: 2rem 0;
  color: #5f6c7b;
  font-weight: 500;
}

.meteogram-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.85rem;
  font-size: 0.88rem;
  color: #475467;
}

.meteogram-legend span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-swatch {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: inline-block;
}

.legend-swatch.temp {
  background: #d92c2c;
}

.legend-swatch.chill {
  background: #6f42c1;
}

.legend-swatch.wind {
  background: #0057b7;
}

.legend-swatch.gust {
  background: #003566;
}

.legend-swatch.rain {
  background: rgba(31, 136, 61, 0.65);
}

.legend-swatch.humidity {
  background: #0c7c59;
}

.meteogram-updated {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #5f6c7b;
}
</style>

<div class="launch-status go">
  We are a GO for launch!
</div>
<!-- Switch the class to `no-go` if we scrub and the banner will turn red. -->

## Lab Access Windows (Nov 13-14)

- **Thursday, Nov 13:** The lab is open now and stays open until 7:30 p.m. Use this time to finish fabrication and assembly.
- **Friday, Nov 14 (3:30–5:30 p.m.):** Final office hours for fabrication/assembly. Put rechargeable batteries on the charger during this window. If you rely on disposable batteries, you will receive a fresh one before launch, but you must check one out from the IAs on Saturday.

## Saturday Morning Timeline

- The lab opens at **10:00 a.m.** on Saturday. Use this slot to gather materials, run quick pre-launch checks, and insert a clean microSD card.
- Do **not** attempt major code or hardware changes Saturday morning, and avoid any testing that could damage your payload—there will not be time to recover from issues.

## Launch Kit Pickup

- Each team will receive a launch kit on Friday containing an engine, igniters, plugs, and recovery wadding.
- Place your team parts box (clear tackle box) inside the purple cabinets on Friday so staff can load the launch materials.
- Every team starts Saturday with one engine. After the first round of launches we will redistribute any remaining engines to teams that need a second attempt.

## What to Bring to Mitchell Field West

Bring the essentials so you can debug on site after your first flight:

- Laptop computer
- microSD card reader
- Cable adapters and your programming cable

## Launch Schedule & Location

- Plan to arrive at the lab between **10:00 a.m. and 11:30 a.m.** on Saturday. Launches begin around **12:00 p.m.** at **Mitchell Field West (softball fields).**
- We will monitor weather closely and send a Canvas + Slack Go/No-Go announcement by **9:30 a.m.** Saturday.

## Weather Outlook

We lock the meteogram to the next launch window (Saturday 12:00 a.m. through Sunday 11:59 p.m.) so you can compare temperature, wind chill, sustained/gusting winds, and rain probabilities without the plot sliding around during the week. NOAA grid-point data powers the stacked charts below, matching the style you see in official NWS briefings.

<div class="forecast-frame">
  <div class="meteogram-card">
    <div class="meteogram-body" data-noaa-meteogram data-lat="42.29" data-lon="-83.73">
      <p class="meteogram-loading">Pulling live data from NOAA…</p>
    </div>
  </div>
</div>

<p class="caption">Source: <a href="https://forecast.weather.gov/MapClick.php?lon=-83.7238&lat=42.286" target="_blank" rel="noopener">NOAA / NWS Detroit-Pontiac</a></p>

<script defer src="{{ '/assets/js/noaa-meteogram.js' | relative_url }}"></script>
