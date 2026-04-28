import { Global, Module } from "@nestjs/common";
import { SecretEncryptionService } from "./secret-encryption.service";
import { PasswordHashAdapter } from "./password-hash.adapter";
import { PASSWORD_HASH_PORT } from "../contexts/users/infrastructure/nest/users-security.tokens";

@Global()
@Module({
  providers: [SecretEncryptionService, PasswordHashAdapter, { provide: PASSWORD_HASH_PORT, useExisting: PasswordHashAdapter }],
  exports: [SecretEncryptionService, PASSWORD_HASH_PORT],
})
export class SecurityModule {}
