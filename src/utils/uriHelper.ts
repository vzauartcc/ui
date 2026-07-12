export const vatsimAuthRedirectUrl = `${getAuthEndpoint()}/oauth/authorize?client_id=${getClientId()}&redirect_uri=${
  window.location.origin + '/login/verify'
}&response_type=code&scope=vatsim_details+full_name+email`;

export const discordRedirectUrl = `https://discord.com/api/oauth2/authorize?client_id=1060336105267929088&redirect_uri=${window.location.origin}%2Fconnect%2Fdiscord&response_type=code&scope=identify%20guilds%20guilds.join`;

function getClientId(): number {
  const env = getEnvironment();

  if (env === 'staging') {
    return 1182;
  } else if (env === 'production') {
    return 1144;
  } else {
    return 466;
  }
}

function getAuthEndpoint(): string {
  if (getEnvironment() === 'development') {
    return 'https://auth-dev.vatsim.net';
  } else {
    return 'https://auth.vatsim.net';
  }
}

export function getEnvironment(): 'development' | 'staging' | 'production' {
  if (import.meta.env.VITE_NODE_ENV) {
    return import.meta.env.VITE_NODE_ENV;
  }

  if (window.location.origin.includes('staging')) {
    return 'staging';
  } else if (window.location.origin.includes('zauartcc.org')) {
    return 'production';
  } else {
    return 'development';
  }
}

export function getS3Url(): string {
  if (import.meta.env.VITE_ORIGIN_ENDPOINT) {
    return import.meta.env.VITE_ORIGIN_ENDPOINT;
  }

  let env = 'production';
  if (window.location.origin.includes('staging')) {
    env = 'staging';
  } else if (window.location.origin.includes('zauartcc.org')) {
    env = 'prod';
  } else {
    env = 'dev';
  }

  return `https://zauartcc-${env}.sfo3.digitaloceanspaces.com`;
}
