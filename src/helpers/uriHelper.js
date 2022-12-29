export const vatsimAuthRedirectUrl = `${getAuthEndpoint()}/oauth/authorize?client_id=${getClientId()}&redirect_uri=${
    window.location.origin + "/login/verify"
  }&response_type=code&scope=vatsim_details+full_name+email`;
  
  export const discordRedirectUrl = `https://discord.com/api/oauth2/authorize?client_id=546531280842653696&redirect_uri=https%3A%2F%2Fzabartcc.org%2Fconnect%2Fdiscord&response_type=code&scope=identify`;
  
  function getClientId() {
    const betaClientId = 1182;
    const prodClientId = 1144;
    const devClientId = 466;
  
    if (window.location.origin.includes("staging")) {
      return betaClientId;
    } else if (window.location.origin.includes("www.zauartcc.org")) {
      return prodClientId;
    } else {
      return devClientId;
    }
  }
  
  function getAuthEndpoint() {
    const authUrl = "https://auth.vatsim.net";
    const authDevUrl = "https://auth-dev.vatsim.net";
  
    if (window.location.origin.includes("localhost")) {
      return authDevUrl;
    } else {
      return authUrl;
    }
  }