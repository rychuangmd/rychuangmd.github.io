// Check the analytics destination and payload without making network requests.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');
const source = readFileSync(join(__dirname, '../assets/site.js'), 'utf8');

function browser({hostname = 'ryanchuangmd.com', signal = false, doNotTrack = '0'} = {}) {
  const scripts = [];
  const document = {
    title: 'Education', querySelector: () => null,
    createElement: () => ({}), head: {append: script => scripts.push(script)}
  };
  const context = {
    document, window: {}, navigator: {globalPrivacyControl: signal, doNotTrack},
    location: {hostname, origin: `https://${hostname}`, pathname: '/education/', search: '?private=value', hash: '#private'}
  };
  vm.runInNewContext(source, context);
  return {context, scripts};
}

test('production analytics loads automatically once, with no advertising or private URL parameters', () => {
  for (const hostname of ['ryanchuangmd.com', 'www.ryanchuangmd.com']) {
    const b = browser({hostname});
    assert.equal(b.scripts.length, 1);
    assert.match(b.scripts[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-YCWX23VR6P$/);
    assert.equal(b.scripts[0].async, true);
    const calls = b.context.window.dataLayer.map(args => Array.from(args));
    const consent = calls.find(call => call[0] === 'consent')[2];
    for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(consent[key], 'denied');
    const config = calls.find(call => call[0] === 'config')[2];
    assert.equal(config.allow_google_signals, false);
    assert.equal(config.allow_ad_personalization_signals, false);
    assert.equal(config.send_page_view, false);
    const event = calls.find(call => call[0] === 'event');
    assert.equal(event[1], 'page_view');
    assert.equal(event[2].page_location, `https://${hostname}/education/`);
    assert.equal(event[2].page_referrer, '');
  }
});

test('local previews and browser privacy signals do not send analytics', () => {
  for (const hostname of ['127.0.0.1', 'localhost', 'preview.example']) assert.equal(browser({hostname}).scripts.length, 0);
  assert.equal(browser({signal: true}).scripts.length, 0);
  assert.equal(browser({doNotTrack: '1'}).scripts.length, 0);
});
