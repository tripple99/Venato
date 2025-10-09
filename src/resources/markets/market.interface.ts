

export enum Market{
   Charanchi = "Charanchi",
   Ajiwa = "Ajiwa",
   Dawanau = "Dawanau",   
}


interface IGeolocation{
  latitude:string
  longitude:string
}


export enum LgaCode {
  CHARANCHI = "CRC-LGA",
  AJIWA = "BAT-LGA",
  DAWANAU = "FGE-LGA",
}


export enum LGA{
  CHARANCHI = "Charanchi",
  AJIWA = "Batagarawa",
  DAWANAU = "Fagge"
}


export interface ILocation{
  state:string;
  code:string;
  LGA?:string;
  country:string;
  cordinates?:IGeolocation
}

export interface IMarketData{
  name:string;
  currency:string;
  location:ILocation;
}