import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { configValidationSchema, getConfig } from './config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: '.env',
      validate: (config) => {
        const { error, value } = configValidationSchema.validate(config, {
          abortEarly: false,
          allowUnknown: true,
        });

        if (error) {
          throw new Error(
            `Configuration validation failed: ${error
              .details.map((d) => d.message)
              .join(', ')}`,
          );
        }

        return value;
      },
      cache: true,
      isGlobal: true,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigurationModule {}

export { ConfigInterface } from './config';
export { getConfig };
