/** @type {import('@framerjs/config').Config} */
module.exports = {
  webpack: {
    resolve: {
      fallback: {
        "@stripe/stripe-js": require.resolve("@stripe/stripe-js")
      }
    }
  }
}
