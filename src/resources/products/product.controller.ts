import { Request, Response, NextFunction, Router } from "express";
import ProductService from "./product.service";
import GlobalController from "../../controllers/globalControllers";
import { authenticate, authorize, authenticateOptional } from "../../Middleware/auths";
import allowedMarket from "../../Middleware/allowMarkets";
import { AuthRole } from "../auths/auth.interface";
import HttpException from "../../exceptions/http.exception";
import schemaValidator from "../../Middleware/schema-validation.middlware";
import validator from "./product.validator";
import { uploadProductImageMiddleware } from "../../Middleware/cloudinary-upload.middleware";
import logger from "../../utils/logger";
import { handleUploadErrors } from "../../resources/cloudinary-service/upload-cloudinary.service";
class ProductController implements GlobalController {
  public path = "product";
  public router = Router();
  private Productservice = new ProductService();

  constructor() {
    this.initializedController();
  }

  private initializedController(): void {
    this.router.get("/All", [authenticateOptional], this.fetchAll);
    this.router.get("/filter", this.filterProduct);
    this.router.get("/filter/market/:market", this.filterProductByMarket);
    this.router.get(
      "/",
      [authenticate, authorize([AuthRole.Admin])],
      this.fetchProducts,
    );
    this.router.get(
      "/:id",
      
      this.fetchProductById,
    );
    this.router.post(
      "/",
      [
        authenticate,
        authorize([AuthRole.Admin]),
        handleUploadErrors(uploadProductImageMiddleware),
        allowedMarket("body"),
      ],
      schemaValidator(validator.createProduct),
      this.createProduct,
    );
    this.router.patch(
      "/:id",
      [
        authenticate,
        authorize([AuthRole.Admin]),
        handleUploadErrors(uploadProductImageMiddleware),
        allowedMarket("body"),
      ],
      schemaValidator(validator.updateProduct),
      this.updateProduct,
    );
    this.router.delete(
      "/:id/:marketId",
      [authenticate, authorize([AuthRole.Admin]), allowedMarket("params")],
      this.deleteProduct,
    );
  }

  private createProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = {
        ...req.body,
        createdBy: req.user?.id,
        updatedBy: req.user?.id,
      };
      const file = req.files as { image?: Express.Multer.File[] };
      if (file?.image) {
        const images = file.image.map((file) => file.path);
        data.images = images;
      }
      const createProduct = await this.Productservice.create(data);
      res.status(200).json({
        status: "Sucess",
        message: "Product created successfully",
        payload: createProduct,
      });
    } catch (error) {
       logger.error("Error processing request", {
    path: req.path,
    method: req.method,
    message: error?.message,
    stack: error?.stack,
    error: JSON.stringify(error, null, 2),
  });
      next(error);
    }
  };
  private fetchAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      const products = await this.Productservice.fetchAllProduct(req.query,userId);
      res.status(200).json({
        status: "Success",
        message: "Products fetched successfully",
        payload: products,
      });
    } catch (error) {
      next(error);
    }
  };
  private filterProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { price } = req.params;
      const result = await this.Productservice.fetchProductByPrice(
         price as string,
        req.query,
      );
      res.status(200).json({
        status: "Successful",
        message: "Product fetch successfull",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };
  private filterProductByMarket = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { market } = req.params;
      const result = await this.Productservice.fetchProductsByMarket(
        market as string,
        req.query,
      );
      res.status(200).json({
        status: "Successfull",
        message: "Product fetch Successfull",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private fetchProducts = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const fetch = await this.Productservice.getProducts(
        req.markets,
        req.query,
      );
      res.status(200).json({
        status: "Success",
        message: "Products fetched successfully",
        payload: fetch,
      });
    } catch (error) {
      next(error);
    }
  };
  private fetchProductById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const product = await this.Productservice.fetchProductById(req.params.id as string);

      res.status(200).json({
        status: "Success",
        message: "Products fetched successfully",
        payload: product,
      });
    } catch (error) {
      next(error);
    }
  };
  private updateProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const file = req.files as { image?: Express.Multer.File[] };
      const newImages = file?.image ? file.image.map((f) => f.path) : [];
      const existingImages = req.body.images
        ? Array.isArray(req.body.images)
          ? req.body.images
          : [req.body.images]
        : [];

      const data = {
        ...req.body,
        images: [...existingImages, ...newImages],
        updatedBy: req.user?.id,
      };

      const result = await this.Productservice.update(req.params.id as string, data);
      res.status(200).json({
        status: "Success",
        message: "Product updated successfully",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };
  private deleteProduct = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      //  const market = req.markets
      const data = await this.Productservice.delete(req.params.id as string);
      res.status(200).json({
        status: "Success",
        message: "Product deleted successfully",
        payload: data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ProductController;
