import { TextDecoder, TextEncoder } from 'node:util';

import '@testing-library/jest-dom';

// react-router reaches for these and jsdom does not provide them
Object.assign(globalThis, { TextEncoder, TextDecoder });
