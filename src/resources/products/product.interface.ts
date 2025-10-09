import {Types} from "mongoose"

export enum UnitValue{
  MUDU = .75,
  TIYA = 1.5,
}

export enum IUnit{
  KG = "kg",
  LITRE = "litre",
  MUDU = "mudu",
  TIYA = "tiya",
}
export enum ICategory{
  Grains = "Grains",
  LegumesAndNuts = "Legumes",
  Vegetables = "Vegetables",
  OilsAndSeeds = "Oils & Seeds",
  Livestock = "Livestock",
  RootsAndTubers = "Roots and Tubers",
  Fruits = "Fruit",
  Others = "Others"

}
interface PriceHistory{
  amount: number;       // the price value
  date: Date;  
}
export interface IMarketProduct {
  name: string;
  unit: IUnit;
  price: number;
  category:ICategory;
  quantityAvailable?: number;
  description?: string;
  market: Types.ObjectId;
  priceHistory:PriceHistory[]
}


// export interface IProduct{
//   name:string,
//   price:string,
//   market:string,
//   currency:string,
   
// }