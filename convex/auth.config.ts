// Configure Clerk as the authentication provider for Convex.
// Replace the domain below with your Clerk Frontend API URL.
// You can find this in your Clerk Dashboard under "Convex" integration.
export default {
  providers: [
    {
      domain: "https://your-clerk-app.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
