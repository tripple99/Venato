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
  app.use((req, res, next) => {
    if (req.body) sanitize(req.body, { replaceWith: '_' });
    if (req.query) sanitize(req.query, { replaceWith: '_' });
    if (req.params) sanitize(req.params, { replaceWith: '_' });
    next();
  });
  app.use(mongoSanitize({
    replaceWith: "_",
    allowDots: true
  }));
 // Add session middleware before passport
  app.use(session(sessionConfig));
 // Passport session
  app.use(passport.initialize());
  app.use(passport.session());

}
