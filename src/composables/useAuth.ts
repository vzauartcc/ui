import { vatsimAuthRedirectUrl } from '@/utils/uriHelper';

export function useAuth() {
  const loginWithVatsim = (currentPath: string) => {
    localStorage.setItem('redirect', currentPath);

    window.location.href = vatsimAuthRedirectUrl;
  };

  return { loginWithVatsim };
}
