// Network requests in browser regressions may reach only the actual local services.
export function allowedRequest(value,c) {
  try {
    const u=new URL(value);
    if(u.username||u.password||!['127.0.0.1','localhost'].includes(u.hostname))return false;
    const port=Number(u.port||(['http:','ws:'].includes(u.protocol)?80:443));
    return (u.protocol==='http:'&&[c.clientPort,c.serverPort].includes(port))||
      (u.protocol==='ws:'&&port===c.serverPort);
  }catch{return false;}
}
export function launchOptions(env=process.env) {
  // Explicitly override Playwright's unsafe-for-this-contract false default.
  // No no-sandbox fallback or CLI/env bypass exists in this CI runner.
  return {headless:true,chromiumSandbox:true,timeout:15000,
    ...(env.TMT2_BROWSER_EXECUTABLE?{executablePath:env.TMT2_BROWSER_EXECUTABLE}:{})};
}
