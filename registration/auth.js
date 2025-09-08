const axios = require("axios");

/**
 * Usage:
 *  node auth.js --base http://20.244.56.144/eva1uation-service --email your@college.edu --name "Your Name" --roll YOUR_ROLL --access YOUR_ACCESS --clientId your-client-id --clientSecret your-client-secret
 */
function arg(name, def=null) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx+1] : def;
}

(async () => {
  const base = arg("base");
  const email = arg("email");
  const name = arg("name");
  const roll = arg("roll");
  const access = arg("access");
  const clientId = arg("clientId");
  const clientSecret = arg("clientSecret");

  if (!base || !email || !name || !roll || !access || !clientId || !clientSecret) {
    console.error("Missing args. See header usage.");
    process.exit(1);
  }

  try {
    const url = `${base}/auth`;
    const body = {
      email, name, rollNo: roll, accessCode: access, clientID: clientId, clientSecret
    };
    const res = await axios.post(url, body, { timeout: 8000 });
    console.log("Auth response:");
    console.log(res.data);
    console.log("\n⚠️ Export the token: export EVAL_TOKEN='<access_token>'");
  } catch (e) {
    console.error("Auth failed:", e.response?.data || e.message);
    process.exit(1);
  }
})();
