declare module "lunar-javascript" {
  export const Solar: {
    fromYmd(year: number, month: number, day: number): any;
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): any;
  };
}
