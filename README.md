# Qimen Dunjia App (奇門遁甲排盤系統)

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF.svg)

A professional, open-source Qimen Dunjia (奇門遁甲) chart calculation system built with modern web technologies. This project is designed to provide accurate Chinese astrological calculations, including Solar/Lunar calendar conversions, Bazi (Four Pillars of Destiny) reverse calculation, and advanced Qimen charting.

## Features

- **Comprehensive Charting**: Supports multiple Qimen charting methods including Shijia (時家), Zhuanpan (轉盤), Feipan (飛盤), and Mingpan (命盤).
- **Time Conversions**: Accurate conversions between Solar and Lunar calendars, with support for True Solar Time (真太陽時) adjustments based on geographic location.
- **Bazi Reverse Calculation**: Input the Four Pillars (Bazi) to dynamically reverse-calculate and find the corresponding Gregorian dates (spanning from 1801 to 2099).
- **Smart Validation**: Intuitive UI with smart constraints (e.g., matching Yang Heavenly Stems with Yang Earthly Branches).
- **PWA Ready**: Built as a Progressive Web App for seamless desktop and mobile experiences.

## Setup & Installation

To run this project locally, make sure you have Node.js installed, then:

```bash
# 1. Clone the repository
git clone https://github.com/truren678-sudo/qimen-app.git

# 2. Navigate to the project directory
cd qimen-app

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

## Available Scripts

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run preview`: Locally previews the production build.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run test`: Runs the automated test suite using Vitest.

## Contributing

We welcome contributions from the open-source community! If you'd like to help improve the project, please read our [Contributing Guidelines](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).
