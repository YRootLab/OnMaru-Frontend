






const RAD = Math.PI / 180;


export const OBLIQUITY = 23.44;

export function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}


export function getSolarDeclination(date = new Date()) {
  const n = getDayOfYear(date);
  return OBLIQUITY * Math.sin((360 / 365) * (n + 284) * RAD);
}


export function getNoonSolarAltitude(latitude, date = new Date()) {
  return 90 - latitude + getSolarDeclination(date);
}





export function altitudeToSeasonValue(altitude, latitude) {
  const maxAlt = 90 - latitude + OBLIQUITY;
  const minAlt = 90 - latitude - OBLIQUITY;
  const v = (maxAlt - altitude) / (maxAlt - minAlt);
  return Math.min(1, Math.max(0, v));
}


export function seasonValueToAltitude(seasonValue, latitude) {
  return 90 - latitude + OBLIQUITY - seasonValue * 2 * OBLIQUITY;
}







export function shadowLengthRatio(altitude) {
  return 1 / Math.tan(Math.max(altitude, 1) * RAD);
}







export function solarTermDate(term, year = new Date().getFullYear()) {
  return new Date(year, term.month - 1, term.day);
}
