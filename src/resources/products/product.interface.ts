import {Types} from "mongoose"

export enum UnitValue{
  MUDU = 1.25,
  TIYA = 0.125,
  LITRE = 0.9,
  KG = 1,
  TONNE = 1000,
}

export enum IUnit{
  KG = "kg",
  LITRE = "litre",
  MUDU = "mudu",
  TIYA = "tiya",
  TONNE = "tonne",
}
export enum ICategory{
  Grains = "Grains",
  LegumesAndNuts = "Legumes",
  Vegetables = "Vegetables",
  OilsAndSeeds = "Oils & Seeds",
  Livestock = "Livestock",
  RootsAndTubers = "Roots and Tubers",
  Fruits = "Fruit",
  Spices = "Spices",
  Others = "Others"


}

export interface IMarketProduct {
  name: string;
  unit: IUnit;
  price: number;
  category:ICategory;
  quantityAvailable?: number;
  description?: string;
  market: Types.ObjectId;
  images:string[];
  // priceHistory:PriceHistory[],
  createdBy:Types.ObjectId;
  updatedBy:Types.ObjectId;
  isWatched?: boolean;
}


// export interface IProduct{
//   name:string,
//   price:string,
//   market:string,
//   currency:string,
   
// }