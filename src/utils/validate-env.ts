import {cleanEnv, port, str} from 'envalid';

export default function validateEnv(): void {
    cleanEnv(process.env,{
        NODE_ENV: str({choices: ['development', 'production', 'test']}),
        PORT: port({default:5000}),
        // MONGO_USER: str(),
        // MONGO_PASSWORD: str(),
        MONGO_URI:str(),
        // JWT_SECRET: str(),
        // REFRESH_TOKEN_SECRET: str(),
        SESSION_SECRET: str(),
        // REDIS_CLIENT_URL: str(),
        // REDIS_CLIENT_PORT: str(),

        // Payment integration
        // PAYSTACK_SECRET_KEY: str(),
        // FLUTTERWAVE_SECRET_KEY: str(),

        // Google Maps
        // GOOGLE_MAPS_API_KEY: str(),

        // Email notifications
        // EMAIL_USER: str(),
        // EMAIL_PASS: str(),

        // SMS notifications
        // SMS_API_KEY: str(),

        // Cloud storage
        // DO_SPACE_ACCESS_KEY: str(),
        // DO_SPACE_SECRET_KEY: str(),
        // DO_SPACE_REGION: str(),
        // DO_SPACE_NAME: str(),
        // DO_SPACE_NAME: str(),
    });
}
