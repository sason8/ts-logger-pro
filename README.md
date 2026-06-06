# đź“ś TS Logger Pro

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

A lightweight, beautiful, and strictly-typed console logger library for Node.js written in TypeScript. 

## Features
- đźŽ¨ Zero-dependency ANSI color formatting
- âŹ±ď¸Ź Automatic ISO timestamps
- đź›ˇď¸Ź 100% strictly typed (TypeScript)
- đź“¦ Out-of-the-box CommonJS support with TypeScript declaration files

## Installation

```bash
npm install ts-logger-pro
```

## Usage

```typescript
import { Logger } from 'ts-logger-pro';

const logger = new Logger({ showTimestamp: true, useColors: true });

logger.info('Application started');
logger.success('Database connected successfully');
logger.warn('Memory usage is high');
logger.error('Failed to authenticate user');
```
