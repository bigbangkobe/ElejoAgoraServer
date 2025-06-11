// services/xunfeiService.js
const axios  = require('axios');
const crypto = require('crypto');

const requestUrl = "https://itrans.xf-yun.com/v1/its";
const appId      = process.env.XF_APP_ID    || 'c07df4ea';
const apiKey     = process.env.XF_API_KEY   || 'ee4977e6d32127deea72e020bc108e65';
const apiSecret  = process.env.XF_API_SECRET|| 'YTE0M2FkMTQzNTJmZDMxOWEzY2M3YjFh';
const resId      = 'its_cn_en_word';
const host       = 'itrans.xf-yun.com';
const path       = '/v1/its';

function buildAuthorization(date) {
  const canonical = `host: ${host}\ndate: ${date}\nPOST ${path} HTTP/1.1`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(canonical)
    .digest('base64');
  const authHeader = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  return Buffer.from(authHeader).toString('base64');
}

async function translate(text, from, to) {
  const date = new Date().toUTCString();
  const authorization = buildAuthorization(date);
  const url = `${requestUrl}?authorization=${encodeURIComponent(authorization)}&host=${encodeURIComponent(host)}&date=${encodeURIComponent(date)}`;

  const payload = {
    header:    { app_id: appId, status: 3, res_id: resId },
    parameter: { its: { from, to, result: {} } },
    payload:   { input_data: { encoding: 'utf8', status: 3, text: Buffer.from(text, 'utf8').toString('base64') } }
  };

  const resp = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });

  // 解码 base64，再解析 JSON
  const b64     = resp.data.payload.result.text;
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  const dst     = JSON.parse(decoded).trans_result.dst;
  return dst;
}

module.exports = { translate };
