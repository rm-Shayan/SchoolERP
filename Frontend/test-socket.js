const { io } = require('socket.io-client');
const http = require('http');

function login(email, password) {
  return new Promise((resolve, reject) => {
    const d = JSON.stringify({ email, password });
    const r = http.request({ hostname:'localhost', port:5000, path:'/api/v1/auth/login', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)} }, (res) => {
      let b=''; res.on('data',(c)=>b+=c);
      res.on('end', () => resolve(JSON.parse(b).data));
    });
    r.on('error', reject);
    r.write(d); r.end();
  });
}

function apiCall(token, method, path, body) {
  return new Promise((resolve, reject) => {
    const d = body ? JSON.stringify(body) : null;
    const opts = { hostname:'localhost', port:5000, path, method, headers:{'Content-Type':'application/json','Authorization':'Bearer '+token} };
    if(d) opts.headers['Content-Length']=Buffer.byteLength(d);
    const r = http.request(opts, (res) => {
      let b=''; res.on('data',(c)=>b+=c);
      res.on('end', () => resolve({status:res.statusCode,body:b}));
    });
    r.on('error', reject);
    if(d) r.write(d); r.end();
  });
}

async function main() {
  const { accessToken } = await login('areesharao9@gmail.com', 'areesharao');
  
  const listener = io('http://localhost:5000', { transports:['websocket'], auth:{token:accessToken} });
  await new Promise(r => listener.on('connect', r));
  console.log('LISTENER connected:', listener.id);
  listener.emit('join_room', 'school:1ff1c26d-af85-4d38-bcb6-3e6ffd2eee11');
  console.log('LISTENER joined school room');
  
  let gotEvents = [];
  listener.onAny((event, ...args) => {
    gotEvents.push({ event, data: JSON.stringify(args[0]).substring(0,200) });
    console.log('GOT EVENT:', event, JSON.stringify(args[0]).substring(0,200));
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  console.log('\n--- Trigger 1: mark-all-read ---');
  const res1 = await apiCall(accessToken, 'POST', '/api/v1/notifications/portal/mark-all-read', {});
  console.log('API:', res1.status, res1.body.substring(0,100));
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('\n--- Summary ---');
  console.log('Total events received:', gotEvents.length);
  gotEvents.forEach(e => console.log(' -', e.event));
  
  listener.disconnect();
}

main().then(() => process.exit(0)).catch(e => { console.error('ERROR:', e.message); process.exit(1); });
