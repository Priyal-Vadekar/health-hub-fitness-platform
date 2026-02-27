
require("dotenv").config({ path: "../frontend/.env" });
const paypal = require('@paypal/checkout-server-sdk');

const environment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isLive = process.env.PAYPAL_MODE === 'live';
  return isLive
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
};

const client = () => new paypal.core.PayPalHttpClient(environment());

module.exports = { paypal, client };




