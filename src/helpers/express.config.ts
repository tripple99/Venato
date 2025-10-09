import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { Application } from 'express';
import expressMongoSanitize from 'express-mongo-sanitize';

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

 // Add session middleware before passport
  app.use(session(sessionConfig));
 // Passport session
  app.use(passport.initialize());
  app.use(passport.session());

}
