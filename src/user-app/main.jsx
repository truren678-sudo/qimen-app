/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import './userApp.css';
import { CHINA_PROVINCES, OVERSEAS_COUNTRIES } from '../data/locationData.js';
import { calculateMingPan } from '../core/calculateMingPan.js';
import { generateMingPanReading } from '../interpreter/generateMingPanReading.js';

const YEARS = Array.from({ length: 101 }, (_, i) => 1930 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

const SECTION_LABEL = {
  overview: '總覽',
  'career-wealth': '事業',
  'current-daxian': '大限',
  relationship: '感情',
  talent: '天賦',
  'health-risk': '身心',
  'annual-timing': '年度',
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function Field({ label, children }) {
  return (
    <label className="mp-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value)} className="mp-select">
      {children}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className={`mp-toggle ${checked ? 'is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="mp-toggle-track"><span /></span>
      <span>{label}</span>
    </button>
  );
}

function BirthPanel({ form, setForm, onGenerate }) {
  const selectedProvince = CHINA_PROVINCES.find(item => item.province === form.province) || CHINA_PROVINCES[0];
  const cities = selectedProvince?.cities || [];
  const overseasRegions = useMemo(() => {
    const groups = {};
    OVERSEAS_COUNTRIES.forEach(country => {
      if (!groups[country.region]) groups[country.region] = [];
      groups[country.region].push(country);
    });
    return groups;
  }, []);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <aside className="mp-panel mp-birth-panel">
      <div className="mp-panel-head">
        <div>
          <p className="mp-kicker">Birth Map</p>
          <h1>九宮奇門命盤</h1>
        </div>
        <div className="mp-mark">9</div>
      </div>

      <Field label="暱稱">
        <input className="mp-input" value={form.displayName} onChange={event => set('displayName', event.target.value)} />
      </Field>

      <div className="mp-segment" role="group" aria-label="曆法">
        <button className={form.calendarType === 'solar' ? 'is-active' : ''} onClick={() => set('calendarType', 'solar')} type="button">公曆</button>
        <button className={form.calendarType === 'lunar' ? 'is-active' : ''} onClick={() => set('calendarType', 'lunar')} type="button">農曆</button>
      </div>

      <div className="mp-grid-3">
        <Field label="年">
          <Select value={form.year} onChange={value => set('year', Number(value))}>
            {YEARS.map(year => <option key={year} value={year}>{year}</option>)}
          </Select>
        </Field>
        <Field label="月">
          <Select value={form.month} onChange={value => set('month', Number(value))}>
            {MONTHS.map(month => <option key={month} value={month}>{month}</option>)}
          </Select>
        </Field>
        <Field label="日">
          <Select value={form.day} onChange={value => set('day', Number(value))}>
            {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
          </Select>
        </Field>
      </div>

      <div className="mp-grid-2">
        <Field label="時">
          <Select value={form.hour} onChange={value => set('hour', Number(value))}>
            {HOURS.map(hour => <option key={hour} value={hour}>{pad(hour)}</option>)}
          </Select>
        </Field>
        <Field label="分">
          <Select value={form.minute} onChange={value => set('minute', Number(value))}>
            {MINUTES.map(minute => <option key={minute} value={minute}>{pad(minute)}</option>)}
          </Select>
        </Field>
      </div>

      <div className="mp-segment" role="group" aria-label="性別">
        <button className={form.gender === '男' ? 'is-active' : ''} onClick={() => set('gender', '男')} type="button">男命</button>
        <button className={form.gender === '女' ? 'is-active' : ''} onClick={() => set('gender', '女')} type="button">女命</button>
      </div>

      <div className="mp-segment" role="group" aria-label="出生地">
        <button className={form.locationType === 'china' ? 'is-active' : ''} onClick={() => set('locationType', 'china')} type="button">國內</button>
        <button className={form.locationType === 'overseas' ? 'is-active' : ''} onClick={() => set('locationType', 'overseas')} type="button">海外</button>
      </div>

      {form.locationType === 'china' ? (
        <div className="mp-grid-2">
          <Field label="省份">
            <Select value={form.province} onChange={value => setForm(prev => ({ ...prev, province: value, city: (CHINA_PROVINCES.find(item => item.province === value)?.cities || [])[0]?.name || '' }))}>
              {CHINA_PROVINCES.map(item => <option key={item.province} value={item.province}>{item.province}</option>)}
            </Select>
          </Field>
          <Field label="城市">
            <Select value={form.city} onChange={value => set('city', value)}>
              {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
            </Select>
          </Field>
        </div>
      ) : (
        <Field label="國家 / 地區">
          <Select value={form.country} onChange={value => set('country', value)}>
            {Object.entries(overseasRegions).map(([region, countries]) => (
              <optgroup key={region} label={region}>
                {countries.map(country => <option key={country.name} value={country.name}>{country.name}</option>)}
              </optgroup>
            ))}
          </Select>
        </Field>
      )}

      <div className="mp-toggles">
        <Toggle checked={form.useTrueSolarTime} onChange={value => set('useTrueSolarTime', value)} label="真太陽時" />
        <Toggle checked={form.isDst} onChange={value => set('isDst', value)} label="夏令時" />
      </div>

      <button type="button" className="mp-primary" onClick={onGenerate}>
        生成命盤
      </button>
    </aside>
  );
}

function MiniGrid({ facts }) {
  return (
    <div className="mp-mini-grid" aria-label="九宮命盤">
      {facts.palaces.map(palace => (
        <div key={palace.num} className={`mp-mini-cell strength-${palace.strength.level}`}>
          <div className="mp-cell-top">
            <strong>{palace.fullName}{palace.num}</strong>
            <span>{palace.luck.score}</span>
          </div>
          <div className="mp-cell-topic">{palace.personnel12.map(item => item.name).join(' / ') || '中宮'}</div>
          <div className="mp-cell-symbols">{[palace.symbols.shen, palace.symbols.star, palace.symbols.door].filter(Boolean).join(' · ')}</div>
          {palace.harms.length > 0 && <div className="mp-cell-harms">{palace.harms.map(item => item.type).join('、')}</div>}
        </div>
      ))}
    </div>
  );
}

function SectionTabs({ sections, active, setActive }) {
  return (
    <div className="mp-tabs">
      {sections.map(section => (
        <button key={section.id} className={active === section.id ? 'is-active' : ''} type="button" onClick={() => setActive(section.id)}>
          {SECTION_LABEL[section.id] || section.title}
        </button>
      ))}
    </div>
  );
}

function ResultView({ facts, reading }) {
  const [activeSection, setActiveSection] = useState('overview');
  const section = reading.sections.find(item => item.id === activeSection) || reading.sections[0];
  const topPalaces = facts.derived.luckRanking.top3;

  return (
    <main className="mp-result">
      <section className="mp-hero-panel">
        <div>
          <p className="mp-kicker">Life Pattern</p>
          <h2>{reading.sourceReadings.overview.headline}</h2>
          <p>{reading.profileTitle}</p>
        </div>
        <div className="mp-age-chip">
          <span>{facts.profile.nominalAge}</span>
          <small>虛歲</small>
        </div>
      </section>

      <section className="mp-summary-band">
        {topPalaces.map(item => (
          <div key={item.num} className="mp-stat">
            <span>{item.score}</span>
            <strong>{item.personnel12.map(p => p.name).join(' / ') || item.name}</strong>
            <small>{item.strength}</small>
          </div>
        ))}
      </section>

      <section className="mp-layout">
        <div className="mp-panel mp-chart-panel">
          <div className="mp-section-head">
            <p className="mp-kicker">Nine Houses</p>
            <h3>命盤結構</h3>
          </div>
          <MiniGrid facts={facts} />
        </div>

        <div className="mp-panel mp-reading-panel">
          <SectionTabs sections={reading.sections} active={activeSection} setActive={setActiveSection} />
          <article>
            <h3>{section.title}</h3>
            {section.text.split('\n\n').map((paragraph, index) => (
              <p key={`${section.id}-${index}`}>{paragraph}</p>
            ))}
          </article>
        </div>
      </section>

      <section className="mp-panel mp-palace-list">
        <div className="mp-section-head">
          <p className="mp-kicker">Twelve Houses</p>
          <h3>十二宮速覽</h3>
        </div>
        <div className="mp-card-grid">
          {reading.palaceReadings.map(item => (
            <article key={item.palace.num + item.palace.personnel12.map(p => p.name).join('')} className="mp-palace-card">
              <div>
                <span>{item.palace.fullName}{item.palace.num}</span>
                <strong>{item.palace.personnel12.map(p => p.name).join(' / ') || '中宮'}</strong>
              </div>
              <p>{item.text.split('\n\n')[1]}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function buildBirthLocation(form) {
  if (form.locationType === 'overseas') {
    const country = OVERSEAS_COUNTRIES.find(item => item.name === form.country) || OVERSEAS_COUNTRIES[0];
    return { type: 'overseas', country };
  }

  const province = CHINA_PROVINCES.find(item => item.province === form.province) || CHINA_PROVINCES[0];
  const city = province.cities.find(item => item.name === form.city) || province.cities[0];
  return { type: 'china', province: province.province, city };
}

function createReadingFromForm(nextForm) {
  const { facts, normalizedBirth } = calculateMingPan({
    calendarType: nextForm.calendarType,
    birthDate: { year: nextForm.year, month: nextForm.month, day: nextForm.day },
    birthTime: { hour: nextForm.hour, minute: nextForm.minute },
    gender: nextForm.gender,
    birthLocation: buildBirthLocation(nextForm),
    isDst: nextForm.isDst,
    useTrueSolarTime: nextForm.useTrueSolarTime,
  }, { asOfDate: new Date('2026-05-05T00:00:00+08:00') });
  return {
    facts,
    normalizedBirth,
    reading: generateMingPanReading(facts, {
      displayName: nextForm.displayName || '命主',
      generatedAt: nextForm.generatedAt,
    }),
  };
}

function App() {
  const [form, setForm] = useState(() => {
    const now = new Date();
    const province = CHINA_PROVINCES.find(item => item.province === '北京市') || CHINA_PROVINCES[0];
    return {
      displayName: '命主',
      calendarType: 'solar',
      year: 1990,
      month: 5,
      day: 12,
      hour: 8,
      minute: 30,
      gender: '男',
      locationType: 'china',
      province: province.province,
      city: province.cities[0].name,
      country: '美國（西岸 PST）',
      isDst: false,
      useTrueSolarTime: true,
      generatedAt: now.toISOString(),
    };
  });
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(() => createReadingFromForm(form));

  const onGenerate = () => {
    try {
      setError('');
      setPayload(createReadingFromForm({ ...form, generatedAt: new Date().toISOString() }));
    } catch (err) {
      setError(err.message || '命盤生成失敗');
    }
  };

  return (
    <div className="mp-app">
      <BirthPanel form={form} setForm={setForm} onGenerate={onGenerate} />
      <div className="mp-content">
        {error && <div className="mp-error">{error}</div>}
        <ResultView facts={payload.facts} reading={payload.reading} />
      </div>
    </div>
  );
}

createRoot(document.getElementById('user-root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
