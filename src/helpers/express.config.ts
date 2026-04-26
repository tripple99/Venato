import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Application } from 'express';
import expressMongoSanitize, { sanitize } from 'express-mongo-sanitize';
import mongoSanitize from 'express-mongo-sanitize';
import session from 'express-session';
import helmet from 'helmet'; 
import passport from 'passport';
import { sessionConfig } from './config';

export function setupMiddlewares(app: Application): void {
  app.disable('x-powered-by');
  app.use(compression());

  app.use(express.json());
  // app.use(bodyParser())
  app.use(express.urlencoded({ extended: false}));
  app.use(helmet());
  // Custom middleware to safely sanitize in-place without reassigning req properties
  // This prevents the "Cannot set property query" TypeError in Express 5
  app.use((req, res, next) => {
    const sanitizeOptions = { replaceWith: "_", allowDots: true };
    if (req.body) sanitize(req.body, sanitizeOptions);
    if (req.query) sanitize(req.query, sanitizeOptions);
    if (req.params) sanitize(req.params, sanitizeOptions);
    if (req.headers) sanitize(req.headers, sanitizeOptions);
    next();
  });
 // Add session middleware before passport
  app.use(session(sessionConfig));
 // Passport session
  app.use(passport.initialize());
  app.use(passport.session());

}
