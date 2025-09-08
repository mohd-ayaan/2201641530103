const axios = require("axios");

/**
 * Usage:
 *  node register.js --base http://20.244.56.144/eva1uation-service --email your@college.edu --name "Your Name" --roll YOUR_ROLL --access YOUR_ACCESS
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

  if (!base || !email || !name || !roll || !access) {
    console.error("Missing args. See header usage.");
    process.exit(1);
  }

  try {
    const url = `${base}/register`;
    const body = {
      email, name, rollNo: roll, accessCode: access
    };
    const res = await axios.post(url, body, { timeout: 8000 });
    console.log("Registration response:");
    console.log(res.data);
    console.log("\n⚠️ Save your clientID and clientSecret safely.");
  } catch (e) {
    console.error("Registration failed:", e.response?.data || e.message);
    process.exit(1);
  }
})();
