export const truncateText = (
  text: string | null | undefined,
  length: number,
) => {
  if (!text) return '';

  if (text.length <= length) return text;

  return text.substring(0, length) + '. . .';
};

export const secToHHMMSS = (val: number, spaced = false) => {
  const hours = Math.floor(val / 3600);
  const minutes = Math.floor((val % 3600) / 60);
  const seconds = val % 60;

  const paddedHours = String(hours.toFixed(0)).padStart(2, '0');
  const paddedMinutes = String(minutes.toFixed(0)).padStart(2, '0');
  const paddedSeconds = String(seconds.toFixed(0)).padStart(2, '0');

  const retval = `${paddedHours}h ${paddedMinutes}m ${paddedSeconds}s`;
  if (!spaced) {
    return retval.replaceAll(' ', '');
  }
  return retval;
};

export const secToHHMM = (val: number) => {
  const hours = Math.floor(val / 3600);
  const minutes = Math.floor((val % 3600) / 60);

  const paddedHours = String(hours.toFixed(0)).padStart(2, '0');
  const paddedMinutes = String(minutes.toFixed(0)).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}`;
};

export const compileUsersName = (data?: {
  name?: string;
  fname: string;
  lname: string;
}) => {
  if (!data) return '';

  if (data.name) return data.name;

  return `${data.fname} ${data.lname}`;
};
