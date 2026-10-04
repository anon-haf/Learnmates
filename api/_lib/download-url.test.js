import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyDownloadTarget,
  resolveDownloadTarget,
  sanitizeFilename,
} from './download-url.js';

describe('resolveDownloadTarget', () => {
  it('resolves site-relative paths', () => {
    const url = resolveDownloadTarget('/documents/foo.pdf', 'https://www.learnmates.org');
    assert.equal(url, 'https://www.learnmates.org/documents/foo.pdf');
  });

  it('rejects invalid urls', () => {
    assert.equal(resolveDownloadTarget('', 'https://www.learnmates.org'), null);
    assert.equal(resolveDownloadTarget('not a url', 'https://www.learnmates.org'), null);
  });
});

describe('classifyDownloadTarget', () => {
  it('proxies learnmates assets', () => {
    const result = classifyDownloadTarget('https://assets.learnmates.org/Questions/foo.pdf');
    assert.equal(result.allowed, true);
    assert.equal(result.mode, 'proxy');
  });

  it('redirects third-party resource hosts', () => {
    const result = classifyDownloadTarget('https://drive.google.com/file/d/abc/view');
    assert.equal(result.allowed, true);
    assert.equal(result.mode, 'redirect');
  });
});

describe('sanitizeFilename', () => {
  it('strips unsafe characters', () => {
    assert.equal(sanitizeFilename('my"file\r\n.pdf'), 'my_file__.pdf');
  });
});
