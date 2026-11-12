import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<fieldset disabled><button id="btn">Click</button><input id="inp" /></fieldset>');
const res = await page.evaluate(() => {
  const btn = document.getElementById('btn');
  const inp = document.getElementById('inp');
  return {
    btnDisabledAttr: btn.hasAttribute('disabled'),
    btnDisabledProp: btn.disabled,
    inpDisabledProp: inp.disabled,
    btnMatchesNotDisabledAttr: btn.matches('button:not([disabled])'),
    btnMatchesDisabledPseudo: btn.matches(':disabled')
  };
});
console.log('Fieldset test result:', res);
await browser.close();
