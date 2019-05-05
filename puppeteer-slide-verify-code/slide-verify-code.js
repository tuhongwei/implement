const puppeteer = require('puppeteer');
const URL = 'http://www.geetest.com/type/'
let browser;

const init = async () => {
  if (browser) {
    return;
  }
  browser = await puppeteer.launch({
    "headless": false,
    "args": ["--start-fullscreen"]
  });
}

const configPage = async (page) => {
  await page.setViewport({width: 1280, height: 1040});
}

const toRightPage = async (page) => {
  await page.goto(URL);
  await page.evaluate(_ => {
    let rect = document.querySelector('.products-content').getBoundingClientRect();
    window.scrollTo(0, rect.top - 30);
  });
  await page.waitFor(1000);
  await page.click(".products-content li:nth-child(2)");
  await page.waitFor(1000);
  await page.click(".geetest_radar_tip");
}

const injectedScript = `
  const getCanvasValue = (selector) => {
    let canvas = document.querySelector(selector);
    canvas.style.display = 'block';
    let ctx = canvas.getContext('2d');
    let [width, height] = [canvas.width, canvas.height];
    console.log(canvas, width, height)
    let rets = [...Array(height)].map(_ => [...Array(width)].map(_ => 0));
    for (let i=0; i<height; i++) {
      for (let j=0; j<width; j++) {
        rets[i][j] = Object.values(ctx.getImageData(j, i, 1, 1).data);
      }
    }
    return rets;
  }
`;

const THRESHOLD = 70;
const _equals = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  for(let i=0; i<a.length; i++) {
    let delta = Math.abs(a[i] - b[i]);
    if (delta > THRESHOLD) {
      return false;
    }
  }
  return true;
}
const _differentSet = (a1, a2) => {
  let rets = [];
  a1.forEach((el, y) => {
    el.forEach((el2, x) => {
      if (!_equals(el2, a2[y][x])) {
        rets.push({
          x,
          y,
          v: el2,
          v2: a2[y][x]
        });
      }
    });
  });
  return rets;
}
const _getLeftTest = (arr) => {
  return arr.sort((a, b) => {
    if (a.x < b.x) {
      return -1;
    } else if (a.x == b.x) {
      if (a.y < b.y) {
        return -1;
      }
      return 1;
    }
    return 1;
  });
}
const _compare = async (page) => {
  await page.waitFor(1000);
  const rets1 = await page.evaluate(() => { return getCanvasValue('.geetest_canvas_fullbg'); }); // 完成图片
  const rets2 = await page.evaluate(() => { return getCanvasValue('.geetest_canvas_bg'); });   // 带缺口图片
  let rets = _differentSet(rets1, rets2);
  return _getLeftTest(rets)[0];
}
const _getY = (x, y) => {
  return Math.floor(Math.random() * (y - x) + x);
}

let _moveTrace = function* (dis) {
  let trace = [];
  let t0 = 0.2;
  let curr = 0;
  let step = 0;
  let a = 0.8;
  while (curr < dis) {
    let t = t0 * ++step;
    curr = parseFloat((1 / 2 * a * t * t).toFixed(2));
    trace.push(curr);
  }
  for(let i = 0; i < trace.length; i++) {
    yield trace[i];
  }
}
const startMove = async (page) => {
  let slider = await page.waitFor(".geetest_slider_button");
  let sliderInfo = await slider.boundingBox();
  let m = page.mouse;
  await m.move(sliderInfo.x + 5, sliderInfo.y + 6);
  await m.down();
  const dest = await _compare(page);
  let gen = _moveTrace(dest.x);
  for(let ret of gen) {
    await m.move(sliderInfo.x + ret, sliderInfo.y + 6 + _getY(-5, 40));
  }
  await m.move(sliderInfo.x + dest.x, sliderInfo.y + 6 + _getY(-5, 40));
  await m.up();
  let isSuccess = await page.evaluate(_ => { 
    if (!!document.querySelector(".geetest_success_animate")) { 
        return true;
    }
    return false;
  });
  if (!isSuccess) {
    await startMove(page);
  }
}


~(async () => {
  await init();
  const page = await browser.newPage();
  await configPage(page);
  await toRightPage(page);
  await page.addScriptTag({content: injectedScript});
  await startMove(page);
})();