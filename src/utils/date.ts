export const timeDiffInHHMMSSAsDate = (start: Date, end = new Date()) => {
  const totalSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const HH = String(hours).padStart(2, '0');
  const MM = String(minutes).padStart(2, '0');

  if (HH === '00') {
    return `${MM}m`;
  }

  return `${HH}h ${MM}m`;
};

export const dateAsMMDDHHMM = (d: Date | string) => {
  const date = new Date(d);

  let year = '';
  if (date.getUTCFullYear() !== new Date().getUTCFullYear()) {
    year = '/' + `${date.getUTCFullYear()}`.slice(-2);
  }

  return `${('0' + (date.getUTCMonth() + 1)).slice(-2)}/${('0' + date.getUTCDate()).slice(-2)}${year} ${('0' + date.getUTCHours()).slice(-2)}:${('0' + date.getUTCMinutes()).slice(-2)}z`;
};

export const dateAsMMDD = (d: Date | string) => {
  const date = new Date(d);

  let year = '';
  if (date.getUTCFullYear() !== new Date().getUTCFullYear()) {
    year = '/' + `${date.getUTCFullYear()}`.slice(-2);
  }

  return `${('0' + (date.getUTCMonth() + 1)).slice(-2)}/${('0' + date.getUTCDate()).slice(-2)}${year}`;
};

export const dateAsMMMMDDYYYY = (d: Date | string) => {
  const date = new Date(d);

  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const dateAsAIP = (d: Date | string) => {
  const date = new Date(d);

  const month = date.toLocaleDateString('en-US', { month: 'short' });

  return `${date.getDate()} ${month} ${date.getFullYear()}`.toUpperCase();
};

export const utcToLocal = (d: Date | string) => {
  const input = new Date(d);
  const offset = input.getTimezoneOffset() * 60 * 1000;

  return new Date(input.getTime() + offset);
};

export const localToUTC = (d: Date | string) => {
  const date = new Date(d);

  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds(),
    ),
  ).toISOString();
};

export const roundToNearest15Minutes = (d: string | Date) => {
  const date = new Date(d);

  const minutes = date.getMinutes();
  const rounded = Math.ceil(minutes / 15) * 15;

  date.setMinutes(rounded);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};
